import logging
import uuid
from datetime import datetime

import boto3
from botocore.client import Config
from django.conf import settings
from django.contrib.auth import authenticate
from django.db.models import Q
from rest_framework import viewsets, generics, permissions, status, parsers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Game, Tag, Order, OrderItem, Review, Payment, Category, Account
from .momo import initiate_momo_payment
from .serializers import *
from .vnpay import vnpay
logger = logging.getLogger(__name__)
from datetime import datetime, timezone, timedelta



class CategoryViewset(viewsets.ViewSet, generics.ListAPIView):
    queryset = Category.objects.filter(active=True)
    serializer_class = CategorySerializer


class UserViewSet(viewsets.ViewSet):
    serializer_class = AccountRegisterSerializer
    permission_classes = [permissions.AllowAny]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    def get_serializer_class(self):
        if self.action == 'login':
            return LoginSerializer
        return AccountRegisterSerializer

    def get_serializer(self, *args, **kwargs):
        return self.get_serializer_class()(*args, **kwargs)

    def create(self, request, *args, **kwargs):
        try:
            with transaction.atomic():
                serializer = self.get_serializer(data=request.data)
                serializer.is_valid(raise_exception=True)
                account = serializer.save()
                response_data = serializer.to_representation(account)
                return Response(response_data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny], url_path='login')
    def login(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        username = serializer.validated_data['username']
        password = serializer.validated_data['password']
        if not username or not password:
            return Response({'detail': 'Thiếu username hoặc password'}, status=status.HTTP_400_BAD_REQUEST)
        user = authenticate(username=username, password=password)
        if not user:
            return Response({'detail': 'Invalid username or password.'}, status=status.HTTP_401_UNAUTHORIZED)
        refresh = RefreshToken.for_user(user)
        return Response({'refresh': str(refresh), 'access': str(refresh.access_token)}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated], url_path='current_user')
    def current_user(self, request):
        account = request.user.account
        if account.role == Account.Role.CUSTOMER:
            if not account.active:
                return Response({'detail': 'Tài khoản CUSTOMER chưa được kích hoạt.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = AccountRegisterSerializer(account)
        return Response(serializer.data)


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['post'], url_path='momo')
    def create_momo_payment_view(self, request):
        order_id = request.data.get("order_id")

        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

        # Use the order's actual total amount to prevent tampering
        amount = int(order.total_amount)

        # Check if payment already exists for this order
        existing_payment = Payment.objects.filter(order=order).first()
        if existing_payment and existing_payment.status == Payment.Status.COMPLETED:
            return Response({
                "error": "Order has already been paid",
                "payment_id": existing_payment.id,
                "status": existing_payment.status
            }, status=status.HTTP_400_BAD_REQUEST)

        # Generate a unique request ID for MoMo
        momo_request_id = str(uuid.uuid4())
        momo_order_id = f"ORDER_{order.id}_{momo_request_id[:8]}"

        try:
            # Call MoMo API
            momo_response = initiate_momo_payment(
                amount=amount,
                order_info=f"Thanh toán đơn hàng #{order.id}",
                redirect_url="http://localhost:3000/thank-you",
                ipn_url=" https://5e80becd1be2.ngrok-free.app/momo/webhook/",
                momo_request_id=momo_request_id,
                momo_order_id=momo_order_id
            )

            # Check if MoMo response is valid
            if 'payUrl' not in momo_response:
                logger.error(f"Invalid MoMo response: {momo_response}")
                return Response({
                    "error": "Failed to create payment with MoMo",
                    "details": momo_response.get('message', 'Unknown error')
                }, status=status.HTTP_502_BAD_GATEWAY)

            # Mark order payment method
            order.payment_method = Order.PaymentMethod.MOMO
            order.save(update_fields=["payment_method"])

            # Create or update the Payment record
            if existing_payment:
                existing_payment.status = Payment.Status.PENDING
                existing_payment.transaction_id = momo_order_id  # Store MoMo's order ID
                existing_payment.payment_url = momo_response.get('payUrl')
                existing_payment.save()
                payment = existing_payment
            else:
                payment = Payment.objects.create(
                    order=order,
                    amount=amount,
                    status=Payment.Status.PENDING,
                    transaction_id=momo_order_id,  # Đây là orderId MoMo sẽ gửi lại
                    payment_url=momo_response.get('payUrl'),
                    payment_date=datetime.now()
                )

            return Response({
                "payUrl": momo_response.get('payUrl'),
                "payment_id": payment.id,
                "status": payment.get_status_display()
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.exception(f"Error creating MoMo payment: {str(e)}")
            return Response({
                "error": "Failed to process payment",
                "details": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'], url_path='vnpay')
    def create_vnpay_payment(self, request):
        order_id = request.data.get("order_id")

        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

        amount = int(order.total_amount)
        existing_payment = Payment.objects.filter(order=order).first()

        if existing_payment and existing_payment.status == Payment.Status.COMPLETED:
            return Response({
                "error": "Order has already been paid",
                "payment_id": existing_payment.id,
                "status": existing_payment.status
            }, status=status.HTTP_400_BAD_REQUEST)

        vn_tz = timezone(timedelta(hours=7))
        create_date = datetime.now(vn_tz).strftime('%Y%m%d%H%M%S')

        vnp = vnpay()
        vnp.requestData['vnp_Version'] = '2.1.0'
        vnp.requestData['vnp_Command'] = 'pay'
        vnp.requestData['vnp_TmnCode'] = settings.VNPAY_TMN_CODE
        vnp.requestData['vnp_Amount'] = amount * 100
        vnp.requestData['vnp_CurrCode'] = 'VND'
        vnp.requestData['vnp_TxnRef'] = order.id
        vnp.requestData['vnp_OrderInfo'] = f"Thanh toán đơn hàng #{order.id}"
        vnp.requestData['vnp_OrderType'] = "billpayment"
        vnp.requestData['vnp_Locale'] = 'vn'
        vnp.requestData['vnp_ReturnUrl'] = settings.VNPAY_RETURN_URL
        vnp.requestData['vnp_CreateDate'] = create_date
        vnp.requestData['vnp_IpAddr'] = request.META.get('REMOTE_ADDR', '127.0.0.1')
        import json
        logger.info("[VNPAY] Request Data: " + json.dumps(vnp.requestData, indent=2, ensure_ascii=False))

        try:
            payment_url = vnp.get_payment_url(settings.VNPAY_PAYMENT_URL, settings.VNPAY_HASH_SECRET_KEY)
            logger.info(f"[VNPAY] Payment URL generated: {payment_url}")

        except Exception:
            return Response({"error": "Failed to generate VNPAY payment URL"},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        if existing_payment:
            existing_payment.status = Payment.Status.PENDING
            existing_payment.transaction_id = str(uuid.uuid4())
            existing_payment.payment_url = payment_url
            existing_payment.save()
            payment = existing_payment
        else:
            payment = Payment.objects.create(
                order=order,
                amount=amount,
                status=Payment.Status.PENDING,
                transaction_id=str(uuid.uuid4()),
                payment_url=payment_url,
                payment_date=datetime.now(timezone(timedelta(hours=7)))
            )

        order.payment_method = Order.PaymentMethod.VNPAY
        order.save(update_fields=["payment_method"])

        return Response({
            "payment_id": payment.id,
            "status": payment.get_status_display(),
            "payment_url": payment_url
        }, status=status.HTTP_200_OK)

class GameViewSet(viewsets.ViewSet, generics.ListAPIView, generics.RetrieveAPIView):
    queryset = Game.objects.filter(active=True)
    serializer_class = GameSerializer

    def get_queryset(self):
        queryset = Game.objects.filter(active=True)
        params = self.request.query_params

        # Category
        category_id = params.get('category_id')
        if category_id:
            queryset = queryset.filter(categories__id=int(category_id))

        # Tag
        tag_id = params.get('tag_id')
        if tag_id:
            queryset = queryset.filter(tags__id=int(tag_id))

        # Search
        q = params.get('q')
        if q:
            queryset = queryset.filter(Q(title__icontains=q))

        # Price range
        price_min = params.get('price_min')
        if price_min:
            queryset = queryset.filter(price__gte=float(price_min))
        price_max = params.get('price_max')
        if price_max:
            queryset = queryset.filter(price__lte=float(price_max))

        return queryset.distinct()

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated], url_path='download')
    def download(self, request, pk=None):
        # Kiểm tra game tồn tại
        try:
            game = Game.objects.get(pk=pk, active=True)
        except Game.DoesNotExist:
            return Response({'detail': 'Game not found'}, status=status.HTTP_404_NOT_FOUND)

        # Kiểm tra account người dùng
        try:
            account = request.user.account
        except Exception:
            return Response({'detail': 'Account not found'}, status=status.HTTP_403_FORBIDDEN)

        # Kiểm tra đã mua game chưa
        purchased = OrderItem.objects.filter(
            order__customer=account,
            order__status__in=['CONFIRMED', 'COMPLETED'],
            game=game
        ).exists()

        if not purchased:
            payment_completed = Payment.objects.filter(
                status='COMPLETED',
                order__customer=account,
                order__items__game=game
            ).exists()
            if not payment_completed:
                return Response({'detail': 'Bạn chưa mua game này'}, status=status.HTTP_403_FORBIDDEN)

        if not game.file:
            return Response({'detail': 'File không tồn tại'}, status=status.HTTP_404_NOT_FOUND)

        s3 = boto3.client(
            's3',
            region_name=settings.AWS_S3_REGION_NAME,
            endpoint_url=settings.AWS_S3_ENDPOINT_URL,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            config=Config(signature_version=settings.AWS_S3_SIGNATURE_VERSION)
        )

        # Lấy key chính xác từ database
        file_key = game.file.name
        print("DEBUG FILE NAME:", game.file.name)
        print("DEBUG BUCKET:", settings.AWS_STORAGE_BUCKET_NAME)
        signed_url = s3.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': settings.AWS_STORAGE_BUCKET_NAME,
                'Key': file_key
            },
            ExpiresIn=3600  # URL hợp lệ 1 giờ
        )

        return Response({'file': signed_url}, status=status.HTTP_200_OK)


class TagViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer


class OrderViewSet(viewsets.ViewSet, generics.ListAPIView, generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = OrderSerializer

    def get_queryset(self):
        # Only orders of current user
        return Order.objects.filter(customer=self.request.user.account).order_by('-created_at')

    def create(self, request):
        game_ids = request.data.get('game_ids') or []
        if not isinstance(game_ids, list) or len(game_ids) == 0:
            return Response({'detail': 'Danh sách game_ids không hợp lệ'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                account = request.user.account
                order = Order.objects.create(customer=account)

                games = Game.objects.filter(id__in=game_ids, active=True)
                if games.count() == 0:
                    return Response({'detail': 'Không có game hợp lệ'}, status=status.HTTP_400_BAD_REQUEST)

                for g in games:
                    OrderItem.objects.create(order=order, game=g, price=g.price)

                serializer = OrderSerializer(order)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.exception("Create order failed")
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # lay danh sach game da mua

    @action(detail=False, methods=['get'])
    def purchased_games(self, request):
        account = request.user.account
        purchased_items = (
            OrderItem.objects
            .filter(order__customer=account, order__status="COMPLETED")
            .select_related("game")
        )
        games = [item.game for item in purchased_items]

        list_games = GameSerializer(games, many=True)

        return Response(list_games.data, status=status.HTTP_200_OK)


class ReviewViewSet(viewsets.ViewSet, generics.ListAPIView):
    serializer_class = ReviewSerializer

    def get_queryset(self):
        qs = Review.objects.filter(active=True).order_by('-created_at')
        game_id = self.request.query_params.get('game_id')
        if game_id:
            try:
                qs = qs.filter(game__id=int(game_id))
            except ValueError:
                pass
        return qs

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def create_review(self, request):
        game_id = request.data.get('game')
        rating = request.data.get('rating')
        comment = request.data.get('comment')

        if not game_id or not rating:
            return Response({'detail': 'Thiếu game hoặc rating'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            game = Game.objects.get(pk=int(game_id), active=True)
        except Exception:
            return Response({'detail': 'Game không hợp lệ'}, status=status.HTTP_400_BAD_REQUEST)

        # Only allow review if user purchased
        account = request.user.account
        purchased = OrderItem.objects.filter(
            order__customer=account,
            order__status__in=[Order.Status.CONFIRMED, Order.Status.COMPLETED],
            game=game
        ).exists()
        if not purchased:
            return Response({'detail': 'Bạn cần mua game trước khi đánh giá'}, status=status.HTTP_403_FORBIDDEN)

        review = Review.objects.create(
            customer=request.user,
            game=game,
            rating=int(rating),
            comment=comment or ''
        )
        return Response(ReviewSerializer(review).data, status=status.HTTP_201_CREATED)


class CartViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_cart(self, account):
        cart, _ = Cart.objects.get_or_create(customer=account)
        return cart

    @action(detail=False, methods=['get'])
    def items(self, request):
        account = request.user.account
        cart = self.get_cart(account)
        serializer = CartSerializer(cart)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def add_item(self, request):
        account = request.user.account
        game_id = request.data.get('game_id')
        if not game_id:
            return Response({'detail': 'Thiếu game_id'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            game = Game.objects.get(pk=game_id, active=True)
        except Game.DoesNotExist:
            return Response({'detail': 'Game không tồn tại'}, status=status.HTTP_404_NOT_FOUND)

        # Kiểm tra đã mua game chưa
        purchased = OrderItem.objects.filter(
            order__customer=account,
            order__status__in=[Order.Status.CONFIRMED, Order.Status.COMPLETED],
            game=game
        ).exists()
        if purchased:
            return Response({'detail': 'Bạn đã mua game này rồi, không thể thêm vào giỏ hàng.'},
                            status=status.HTTP_400_BAD_REQUEST)

        cart = self.get_cart(account)
        if CartItem.objects.filter(cart=cart, game=game).exists():
            return Response({'detail': 'Game đã có trong giỏ hàng.'}, status=status.HTTP_400_BAD_REQUEST)

        item = CartItem.objects.create(cart=cart, game=game)
        return Response(CartItemSerializer(item).data, status=status.HTTP_201_CREATED)

    # xoa 1 game
    @action(detail=False, methods=['delete'])
    def remove_item(self, request):
        account = request.user.account
        game_id = request.data.get('game_id')
        cart = self.get_cart(account)
        try:
            item = CartItem.objects.get(cart=cart, game_id=game_id)
            item.delete()
            return Response({'detail': 'Đã xóa game khỏi giỏ hàng.'}, status=status.HTTP_204_NO_CONTENT)
        except CartItem.DoesNotExist:
            return Response({'detail': 'Game không có trong giỏ hàng.'}, status=status.HTTP_404_NOT_FOUND)

    # xoa nhieu game
    @action(detail=False, methods=['delete'])
    def clear(self, request):
        account = request.user.account
        cart = self.get_cart(account)
        cart.items.all().delete()
        return Response({'detail': 'Đã xóa toàn bộ giỏ hàng.'}, status=status.HTTP_204_NO_CONTENT)

    def clear_items_after_purchase(self, account, games):
        cart = self.get_cart(account)
        CartItem.objects.filter(cart=cart, game__in=games).delete()


class RevenueStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # --- 1. Doanh thu tổng theo tháng (gộp) ---
        revenue_dict = {}
        orders = Order.objects.all()
        for order in orders:
            key = (order.created_at.year, order.created_at.month)
            if key in revenue_dict:
                revenue_dict[key] += order.total_amount
            else:
                revenue_dict[key] = order.total_amount

        revenue_total = [
            {"year": year, "month": month, "total": total}
            for (year, month), total in sorted(revenue_dict.items())
        ]

        categories = Category.objects.all()
        # --- 3. Số lượng game theo category ---
        quantity_by_category = []
        for c in categories:
            qty = Game.objects.filter(categories=c).count()
            quantity_by_category.append({
                "category": c.name,
                "quantity": qty
            })

        # --- 4. Số lượng game theo tag ---
        quantity_by_tag = []
        tags = Tag.objects.all()
        for t in tags:
            qty = Game.objects.filter(tags=t).count()
            quantity_by_tag.append({
                "tag": t.name,
                "quantity": qty
            })

        return Response({
            "revenue_total": revenue_total,
            "quantity_by_category": quantity_by_category,
            "quantity_by_tag": quantity_by_tag
        })

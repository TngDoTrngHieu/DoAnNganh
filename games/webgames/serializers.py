from webgames.models import Tag,Game,Developer,Review,OrderItem,Order,Category,Account,User,Payment
from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from django.db import transaction


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model= Category
        fields=['id','name']


class AccountRegisterSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username')
    password = serializers.CharField(source='user.password', write_only=True)
    email = serializers.EmailField(source='user.email')
    first_name = serializers.CharField(source='user.first_name', required=False)
    last_name = serializers.CharField(source='user.last_name', required=False)

    class Meta:
        model = Account
        fields = [
            'id',
            'username', 'password', 'email',
            'first_name', 'last_name', 'avatar',
            'role', 'phone_number']
        extra_kwargs = {
            'password': {'write_only': True},
        }

    def validate(self, attrs):
        role = attrs.get('role', Account.Role.CUSTOMER)

        # Nếu là ADMIN → avatar bắt buộc
        if role == Account.Role.ADMIN and not attrs.get('avatar'):
            raise serializers.ValidationError({
                'avatar': 'Avatar là bắt buộc đối với tài khoản ADMIN!'
            })

        # Nếu là CUSTOMER → không bắt buộc các trường của admin
        if role == Account.Role.CUSTOMER:
            # Có thể thêm logic kiểm tra khác cho khách hàng
            pass

        return attrs

    def create(self, validated_data):
        # Tách thông tin user từ dữ liệu đã validate
        user_data = validated_data.pop('user')
        user_data['password'] = make_password(user_data['password'])  # Băm password

        # Tạo User object
        user = User.objects.create(**user_data)

        # Tạo Account
        account = Account.objects.create(user=user, **validated_data)

        return account

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['id', 'amount', 'status', 'transaction_id', 'payment_url', 'payment_date']
        read_only_fields = fields


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name']

class GameSerializer(serializers.ModelSerializer):
    categories = CategorySerializer(many=True, read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    developer = serializers.StringRelatedField(read_only=True)
    image = serializers.SerializerMethodField()
    file = serializers.SerializerMethodField()

    class Meta:
        model = Game
        fields = [
            'id', 'title', 'description', 'price', 'categories', 'image', 'file',
            'tags', 'view_count', 'purchase_count', 'developer', 'created_at', 'update_at'
        ]

    def get_image(self, obj):
        try:
            return obj.image.url if obj.image else None
        except Exception:
            return None

    def get_file(self, obj):
        try:
            return obj.file.url if obj.file else None
        except Exception:
            return None

class OrderItemSerializer(serializers.ModelSerializer):
    game_title = serializers.CharField(source='game.title', read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'game', 'game_title', 'price', 'created_at']
        read_only_fields = ['id', 'game_title', 'created_at']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    total_amount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'status', 'payment_method', 'note', 'items', 'total_amount', 'created_at', 'update_at'
        ]
        read_only_fields = ['id', 'items', 'total_amount', 'created_at', 'update_at']


class ReviewSerializer(serializers.ModelSerializer):
    customer = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'customer', 'game', 'rating', 'comment', 'image', 'created_at']
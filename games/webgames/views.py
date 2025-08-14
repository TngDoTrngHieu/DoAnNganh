from django.contrib.auth import authenticate
from django.db.models import Q
from django.db import transaction
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import viewsets, generics, permissions, status, parsers
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action

from .serializers import *


class CategoryViewset(viewsets.ViewSet, generics.ListAPIView):
    queryset = Category.objects.filter(active=True)
    serializer_class = CategorySerializer


class UserViewSet(viewsets.ViewSet):
    serializer_class = AccountRegisterSerializer
    permission_classes = [permissions.AllowAny]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    def get_serializer(self, *args, **kwargs):
        return self.serializer_class(*args, **kwargs)

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
        username = request.data.get('username')
        password = request.data.get('password')
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




class GameViewSet(viewsets.ViewSet, generics.ListAPIView, generics.RetrieveAPIView):
    queryset = Game.objects.filter(active=True)
    serializer_class = GameSerializer


    def get_queryset(self):
        return Game.objects.filter(active=True)








from django.contrib import admin
from django.db import router
from django.urls import path,include
from  rest_framework.routers import DefaultRouter
from webgames.webhook import momo_webhook_view
from webgames.views import *


router = DefaultRouter()
router.register('categories',CategoryViewset,basename='category')
router.register('games', GameViewSet, basename='game')
router.register('users', UserViewSet, basename='user')
router.register('tags', TagViewSet, basename='tag')
router.register('orders', OrderViewSet, basename='order')
router.register('payments', PaymentViewSet, basename='payment')
router.register('reviews', ReviewViewSet, basename='review')




urlpatterns = [
    path('', include(router.urls)),
    path('momo/webhook/', momo_webhook_view, name='momo-webhook'),
]

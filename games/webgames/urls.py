from django.contrib import admin
from django.db import router
from django.urls import path,include
from  rest_framework.routers import DefaultRouter

from webgames.views import *


router = DefaultRouter()
router.register('categories',CategoryViewset,basename='category')
router.register('games', GameViewSet, basename='game')
router.register('users', UserViewSet, basename='user')




urlpatterns = [
    path('', include(router.urls)),
]

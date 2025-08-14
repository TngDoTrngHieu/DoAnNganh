from django.contrib import admin
from django.utils.safestring import mark_safe
from django.urls import path
from .models import User, Account, Category, Tag, Game, Order, OrderItem, Review, Developer


class MyAdminSite(admin.AdminSite):
    site_header = 'Web Game Online'
    
    class Media:
        css = {
            'all': ('/static/css/styles.css',)
        }
    def get_urls(self):
        return [path('game-stats/', self.game_stats, name='game-stats')] + super().get_urls()

    def game_stats(self, request):
        pass


admin_site = MyAdminSite(name='GameOnline')

# Đăng ký các model với admin site tùy chỉnh
admin_site.register(User)
admin_site.register(Account)
admin_site.register(Category)
admin_site.register(Tag)
admin_site.register(Game)
admin_site.register(Order)
admin_site.register(OrderItem)
admin_site.register(Review)
admin_site.register(Developer)



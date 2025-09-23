from django.contrib import admin
from django.db.models import Count, Sum, F
from django.template.response import TemplateResponse
from django.urls import path
from requests import Response

from .models import User, Account, Category, Tag, Game, Order, OrderItem, Review, Developer, Cart, CartItem, Payment


class MyAdminSite(admin.AdminSite):
    site_header = 'Web Game Online'

    class Media:
        css = {
            'all': ('/static/css/styles.css',)
        }

    def get_urls(self):
        return [path('game-stats/', self.game_stats, name='game-stats')] + super().get_urls()

    def game_stats(self, request):
        revenue_dict = {}
        payments = Payment.objects.filter(status=Payment.Status.COMPLETED).select_related('order')

        for payment in payments:
            if payment.created_at: 
                key = (payment.created_at.year, payment.created_at.month)
                revenue_dict[key] = revenue_dict.get(key, 0) + float(payment.amount)

        available_years = sorted(set([year for year, month in revenue_dict.keys()]))
        
        # Tạo dữ liệu theo tháng
        revenue_total = []
        for year in available_years:
            for month in range(1, 13):  # Từ tháng 1 đến 12
                total = revenue_dict.get((year, month), 0)
                revenue_total.append({
                    "year": year,
                    "month": month,
                    "total": float(total)  # Chuyển Decimal thành float
                })
        
        # Tạo dữ liệu theo quý
        revenue_by_quarter = []
        for year in available_years:
            for quarter in range(1, 5):  # 4 quý
                quarter_total = 0
                start_month = (quarter - 1) * 3 + 1
                end_month = quarter * 3
                for month in range(start_month, end_month + 1):
                    quarter_total += revenue_dict.get((year, month), 0)
                
                revenue_by_quarter.append({
                    "year": year,
                    "quarter": quarter,
                    "total": float(quarter_total)
                })
        
        # --- 3. Số lượng game đã bán theo category ---
        quantity_by_category = []
        categories = Category.objects.all()
        for c in categories:
            # Đếm số lượng OrderItem của các game thuộc category này
            qty = OrderItem.objects.filter(
                order__payment__status=Payment.Status.COMPLETED,
                game__categories=c
            ).count()
            quantity_by_category.append({
                "category": c.name,
                "quantity": qty
            })

        # --- 4. Số lượng game đã bán theo tag ---
        quantity_by_tag = []
        tags = Tag.objects.all()
        for t in tags:
            # Đếm số lượng OrderItem của các game thuộc tag này
            qty = OrderItem.objects.filter(
                order__payment__status=Payment.Status.COMPLETED,
                game__tags=t
            ).count()
            quantity_by_tag.append({
                "tag": t.name,
                "quantity": qty
            })

        context = dict(
            self.each_context(request),
            revenue_total=revenue_total,
            revenue_by_quarter=revenue_by_quarter,
            quantity_by_category=quantity_by_category,
            quantity_by_tag=quantity_by_tag,
            available_years=available_years
        )
        return TemplateResponse(request, "admin/game_stats.html", context)
  


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
admin_site.register(Cart)
admin_site.register(CartItem)

from django.core.mail import send_mail
from django.conf import settings

def send_payment_email(user_email, order_id):
    subject = f"Xác nhận thanh toán Order #{order_id}"
    message = f"""
    Xin chào,

    Đơn hàng #{order_id} của bạn đã được thanh toán thành công.
    Bạn có thể tải game trong trang cá nhân.

    Chúc bạn chơi game vui vẻ 🎮
    Trân trọng,
    Đội ngũ Game Store
    """
    send_mail(
        subject,
        message,
        settings.EMAIL_HOST_USER,
        [user_email],
        fail_silently=False,
    )

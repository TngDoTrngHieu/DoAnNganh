# webhook_debug.py
import json

from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
import logging
import hmac
import hashlib
from .utils import send_payment_email
from .models import Payment, Order

logger = logging.getLogger(__name__)

# MoMo sandbox config
MOMO_PARTNER_CODE = 'MOMO'       # cố định theo sandbox
MOMO_ACCESS_KEY = 'F8BBA842ECF85'
MOMO_SECRET_KEY = 'K951B6PE1waDMi640xX08PD3vg6EkVlz'

def safe_str(value):
    return "" if value is None else str(value)

@api_view(["POST"])
@csrf_exempt
def momo_webhook_view(request):
    try:
        data = json.loads(request.body.decode("utf-8"))
        received_signature = data.get("signature")

        raw_signature = (
            f"accessKey={MOMO_ACCESS_KEY}"
            f"&amount={data.get('amount')}"
            f"&extraData={data.get('extraData')}"
            f"&message={data.get('message')}"
            f"&orderId={data.get('orderId')}"
            f"&orderInfo={data.get('orderInfo')}"
            f"&orderType={data.get('orderType')}"
            f"&partnerCode={data.get('partnerCode')}"
            f"&payType={data.get('payType')}"
            f"&requestId={data.get('requestId')}"
            f"&responseTime={data.get('responseTime')}"
            f"&resultCode={data.get('resultCode')}"
            f"&transId={data.get('transId')}"
        )

        calculated_signature = hmac.new(
            MOMO_SECRET_KEY.encode("utf-8"),
            raw_signature.encode("utf-8"),
            hashlib.sha256
        ).hexdigest()

        if calculated_signature != received_signature:

            return Response({"message": "Invalid signature"}, status=status.HTTP_400_BAD_REQUEST)


        order_id = data.get("orderId")
        result_code = data.get("resultCode")

        try:
            payment = Payment.objects.get(transaction_id=order_id)
            order = payment.order
        except Payment.DoesNotExist:
            return Response({"message": "Payment not found"}, status=status.HTTP_404_NOT_FOUND)

        # B5: Cập nhật trạng thái
        if result_code == 0:  # Thành công
            payment.status = "COMPLETED"
            order.status = "COMPLETED"
            send_payment_email(user_email=order.customer.user.email,       # email của người dùng
                order_id=order.id)
            payment.save()
            order.save()

        else:
            payment.status = "FAILED"
            order.status = "FAILED"
            order.save()

        return Response({"message": "Payment updated"}, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({"message": "Internal Server Error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


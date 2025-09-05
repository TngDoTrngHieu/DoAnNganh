import hashlib
import hmac
import urllib.parse
import json
from datetime import datetime, timezone, timedelta
from django.conf import settings
from django.shortcuts import redirect
from rest_framework.decorators import api_view
from rest_framework.response import Response
from webgames.models import Payment
from logger import logger  # đảm bảo logger của bạn hỗ trợ UTF-8


class vnpay:
    def __init__(self):
        self.requestData = {}
        self.responseData = {}

    def get_payment_url(self, vnpay_payment_url, secret_key):
        inputData = sorted((k, v) for k, v in self.requestData.items() if k.startswith('vnp_'))
        queryString = '&'.join(f"{k}={urllib.parse.quote_plus(str(v))}" for k, v in inputData)
        hashValue = self.__hmacsha512(secret_key, queryString)
        try:
            logger.info("[VNPAY] Request Data:\n%s", json.dumps(self.requestData, indent=2, ensure_ascii=False))
            logger.info("[VNPAY] queryString: %s", queryString)
            logger.info("[VNPAY] hashValue: %s", hashValue)
        except UnicodeEncodeError:
            logger.info("[VNPAY] Request Data (ascii fallback):\n%s", json.dumps(self.requestData, indent=2, ensure_ascii=True))

        # 5. Trả về URL đầy đủ
        return f"{vnpay_payment_url}?{queryString}&vnp_SecureHash={hashValue}"

    def validate_response(self, secret_key):
        """Kiểm tra chữ ký VNPAY trả về"""
        vnp_SecureHash = self.responseData.get('vnp_SecureHash')
        if not vnp_SecureHash:
            return False

        # Bỏ các param hash khỏi dict
        self.responseData.pop('vnp_SecureHash', None)
        self.responseData.pop('vnp_SecureHashType', None)

        # Lọc key bắt đầu vnp_ và sắp xếp
        inputData = sorted((k, v) for k, v in self.responseData.items() if k.startswith('vnp_'))
        hashData = '&'.join(f"{k}={urllib.parse.quote_plus(str(v))}" for k, v in inputData)

        # Tạo hash
        hashValue = self.__hmacsha512(secret_key, hashData)

        # Debug log
        logger.info("Validate debug:\nHashData: %s\nHashValue: %s\nInputHash: %s", hashData, hashValue, vnp_SecureHash)

        return vnp_SecureHash == hashValue

    @staticmethod
    def __hmacsha512(key, data):
        """Tạo HMAC SHA512"""
        byteKey = key.encode('utf-8')
        byteData = data.encode('utf-8')
        return hmac.new(byteKey, byteData, hashlib.sha512).hexdigest()


@api_view(['GET'])
def vnpay_return(request):
    vnp = vnpay()
    vnp.responseData = request.GET.dict()

    if vnp.validate_response(settings.VNPAY_HASH_SECRET_KEY):
        txn_ref = vnp.responseData.get('vnp_TxnRef')
        rsp_code = vnp.responseData.get('vnp_ResponseCode')

        payment = Payment.objects.filter(order_id=txn_ref).first()
        if payment:
            if rsp_code == '00':
                payment.status = Payment.Status.COMPLETED
                if payment.order:
                    payment.order.status = payment.order.Status.COMPLETED
                    payment.order.save(update_fields=["status"]) 
            else:
                payment.status = Payment.Status.FAILED
            payment.save(update_fields=["status"]) 

        frontend_thankyou = f"{settings.FRONTEND_BASE_URL}/thank-you?order_id={txn_ref}&status={'success' if rsp_code=='00' else 'failed'}"
        return redirect(frontend_thankyou)


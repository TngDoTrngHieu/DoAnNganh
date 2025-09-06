from django.conf import settings
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework.utils.mediatypes import order_by_precedence

from webgames.models import Payment
from webgames.utils import send_payment_email
from webgames.vnpay import vnpay


@api_view(['GET'])
def vnpay_ipn(request):
    vnp = vnpay()
    vnp.responseData = request.GET.dict()

    if vnp.validate_response(settings.VNPAY_HASH_SECRET_KEY):
        txn_ref = vnp.responseData['vnp_TxnRef']
        rsp_code = vnp.responseData['vnp_ResponseCode']

        payment = Payment.objects.filter(order_id=txn_ref).first()
        order = payment.order
        if not payment:
            return Response({"RspCode": "01", "Message": "Order not found"})

        if rsp_code == '00':
            payment.status = Payment.Status.COMPLETED
            if payment.order:
                payment.order.status = payment.order.Status.COMPLETED
                payment.order.save(update_fields=["status"])
                send_payment_email(user_email=order.customer.user.email,
                                   order_id=order.id)
        else:
            payment.status = Payment.Status.FAILED
        payment.save(update_fields=["status"]) 
        return Response({"RspCode": "00", "Message": "Confirm Success"})
    return Response({"RspCode": "97", "Message": "Invalid Signature"})

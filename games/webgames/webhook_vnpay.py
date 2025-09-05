from django.conf import settings
from rest_framework.response import Response
from rest_framework.decorators import api_view

from webgames.models import Payment
from webgames.vnpay import vnpay


@api_view(['GET'])
def vnpay_ipn(request):
    vnp = vnpay()
    vnp.responseData = request.GET.dict()

    if vnp.validate_response(settings.VNPAY_HASH_SECRET_KEY):
        txn_ref = vnp.responseData['vnp_TxnRef']
        rsp_code = vnp.responseData['vnp_ResponseCode']

        payment = Payment.objects.filter(order_id=txn_ref).first()
        if not payment:
            return Response({"RspCode": "01", "Message": "Order not found"})

        if rsp_code == '00':
            payment.status = Payment.Status.COMPLETED
            if payment.order:
                payment.order.status = payment.order.Status.COMPLETED
                payment.order.save(update_fields=["status"]) 
        else:
            payment.status = Payment.Status.FAILED
        payment.save(update_fields=["status"]) 
        return Response({"RspCode": "00", "Message": "Confirm Success"})
    return Response({"RspCode": "97", "Message": "Invalid Signature"})

from django.db import models
from django.contrib.auth.models import AbstractUser
from cloudinary.models import CloudinaryField
from django.core.validators import RegexValidator
from storages.backends.s3boto3 import S3Boto3Storage

# ----- BASE MODEL -----
class BaseModel(models.Model):
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    update_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

# ----- USER -----
class User(AbstractUser):
    is_admin = models.BooleanField(default=False)

class Account(BaseModel):
    class Role(models.TextChoices):
        ADMIN = 'ADMIN', 'Quản trị viên'
        CUSTOMER = 'CUSTOMER', 'Khách hàng'

    avatar = CloudinaryField('avatar', null=True, blank=True)
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.CUSTOMER)
    phone_regex = RegexValidator(regex=r'^\+?1?\d{9,15}$', message="Số điện thoại phải đúng định dạng.")
    phone_number = models.CharField(validators=[phone_regex], max_length=15, null=True, blank=True)
    is_verified = models.BooleanField(default=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='account')

    def __str__(self):
        return self.user.username

# ----- CATEGORY & TAG -----
class Category(BaseModel):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name

class Tag(models.Model):
    name = models.CharField(max_length=50)

    def __str__(self):
        return self.name

# ----- GAME -----
class Game(BaseModel):
    title = models.CharField(max_length=200)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    categories = models.ManyToManyField(Category, related_name='games')
    image = CloudinaryField('image', null=True, blank=True)  # Cover image
    file = models.FileField(
        storage=S3Boto3Storage(
            bucket_name="webgame",
            custom_domain=None
        ),
        upload_to="games/files/",
        null=True,
        blank=True
    )
    tags = models.ManyToManyField(Tag, related_name="games")
    view_count = models.PositiveIntegerField(default=0)
    purchase_count = models.PositiveIntegerField(default=0)
    developer = models.ForeignKey('Developer', on_delete=models.SET_NULL, null=True, blank=True, related_name='games')

    def __str__(self):
        return self.title

# ----- ORDER (thay thế Purchase) -----
class Order(BaseModel):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Chờ xác nhận'
        CONFIRMED = 'CONFIRMED', 'Đã xác nhận'
        COMPLETED = 'COMPLETED', 'Hoàn thành'
        CANCELLED = 'CANCELLED', 'Đã hủy'
    class PaymentMethod(models.TextChoices):
        MOMO = 'MOMO', 'Momo'
        VNPAY = 'VNPAY', 'VNPay'

    customer = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='orders')
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    payment_method = models.CharField(max_length=10, choices=PaymentMethod.choices, default=PaymentMethod.MOMO)
    note = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Order #{self.id} - {self.customer}"

    @property
    def total_amount(self):
        items_total = sum(item.price for item in self.items.all())
        return items_total

class OrderItem(BaseModel):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    game = models.ForeignKey(Game, on_delete=models.PROTECT)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    def __str__(self):
        return f"{self.game.title}"

# ----- REVIEW -----
class Review(BaseModel):
    RATING_CHOICES = [
        (1, '1 sao'),
        (2, '2 sao'),
        (3, '3 sao'),
        (4, '4 sao'),
        (5, '5 sao'),
    ]

    customer = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='reviews')
    rating = models.PositiveSmallIntegerField(choices=RATING_CHOICES)
    comment = models.TextField()
    image = CloudinaryField('review_image', null=True, blank=True)

    def __str__(self):
        return f"Review {self.rating} sao cho {self.game.title}"

class Payment(BaseModel):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Chờ thanh toán'
        PROCESSING = 'PROCESSING', 'Đang xử lý'
        COMPLETED = 'COMPLETED', 'Đã thanh toán'
        FAILED = 'FAILED', 'Thanh toán thất bại'
        REFUNDED = 'REFUNDED', 'Đã hoàn tiền'

    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='payment')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    transaction_id = models.CharField(max_length=255, blank=True, null=True)
    payment_url = models.TextField(default="")
    payment_date = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"Payment for Order #{self.order.id}"


class Developer(BaseModel):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    logo = CloudinaryField('developer_logo', null=True, blank=True)

    def __str__(self):
        return self.name


class Cart(models.Model):
    customer = models.OneToOneField('Account', on_delete=models.CASCADE, related_name='cart')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Cart of {self.customer.user.username}"

class CartItem(BaseModel):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    game = models.ForeignKey('Game', on_delete=models.CASCADE)


    class Meta:
        unique_together = ('cart', 'game')  # Một game chỉ có 1 lần trong cart

    def __str__(self):
        return f"{self.game.title} in {self.cart.customer.user.username}'s cart"
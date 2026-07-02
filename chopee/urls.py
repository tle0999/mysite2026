from django.urls import path
from . import views

app_name = 'chopee'

urlpatterns = [
    path('', views.home, name='home'),
    path('api/product/<int:pk>/', views.product_detail_api, name='product_detail_api'),
    path('api/cart/', views.cart_list_api, name='cart_list_api'),
    path('api/cart/add/<int:product_id>/', views.cart_add_api, name='cart_add_api'),
    path('api/cart/update/<int:product_id>/', views.cart_update_api, name='cart_update_api'),
    path('api/cart/remove/<int:product_id>/', views.cart_remove_api, name='cart_remove_api'),
    path('api/checkout/', views.checkout_api, name='checkout_api'),
]

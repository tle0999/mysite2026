from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse, HttpResponse
from django.db.models import Q
from .models import Category, Product, CartItem, Order, OrderItem
import json

def get_session_key(request):
    if not request.session.session_key:
        request.session.create()
    return request.session.session_key

def home(request):
    session_key = get_session_key(request)
    categories = Category.objects.all()
    products = Product.objects.all()
    
    # Query parameters
    query = request.GET.get('q', '').strip()
    category_slug = request.GET.get('category', '').strip()
    sort_by = request.GET.get('sort', '').strip() # 'price_asc', 'price_desc', 'sales'
    
    if query:
        products = products.filter(
            Q(name__icontains=query) | Q(description__icontains=query)
        )
        
    if category_slug:
        products = products.filter(category__slug=category_slug)
        
    if sort_by == 'price_asc':
        products = products.order_by('price')
    elif sort_by == 'price_desc':
        products = products.order_by('-price')
    elif sort_by == 'sales':
        products = products.order_by('-sales_count')
    else:
        products = products.order_by('-id') # Default newest
        
    flash_sales = Product.objects.filter(is_flash_sale=True)[:6]
    
    # Calculate cart count for navbar
    cart_items = CartItem.objects.filter(session_key=session_key)
    cart_count = sum(item.quantity for item in cart_items)
    
    context = {
        'categories': categories,
        'products': products,
        'flash_sales': flash_sales,
        'query': query,
        'category_slug': category_slug,
        'sort_by': sort_by,
        'cart_count': cart_count,
    }
    return render(request, 'chopee/home.html', context)

def product_detail_api(request, pk):
    product = get_object_or_404(Product, pk=pk)
    data = {
        'id': product.id,
        'name': product.name,
        'category': product.category.name,
        'price': float(product.price),
        'discount_price': float(product.discount_price) if product.discount_price else None,
        'description': product.description,
        'image': product.image,
        'rating': float(product.rating),
        'sales_count': product.sales_count,
        'stock': product.stock,
        'is_flash_sale': product.is_flash_sale,
    }
    return JsonResponse(data)

def cart_list_api(request):
    session_key = get_session_key(request)
    cart_items = CartItem.objects.filter(session_key=session_key)
    
    items_data = []
    original_total = 0
    discounted_total = 0
    total_quantity = 0
    
    for item in cart_items:
        p = item.product
        price = p.discount_price if p.discount_price else p.price
        original_item_total = float(p.price) * item.quantity
        discounted_item_total = float(price) * item.quantity
        
        original_total += original_item_total
        discounted_total += discounted_item_total
        total_quantity += item.quantity
        
        items_data.append({
            'id': item.id,
            'product_id': p.id,
            'name': p.name,
            'image': p.image,
            'price': float(p.price),
            'discount_price': float(p.discount_price) if p.discount_price else None,
            'quantity': item.quantity,
            'stock': p.stock,
            'subtotal': discounted_item_total,
        })
        
    return JsonResponse({
        'items': items_data,
        'original_total': original_total,
        'total': discounted_total,
        'savings': original_total - discounted_total,
        'total_quantity': total_quantity,
    })

def cart_add_api(request, product_id):
    if request.method == 'POST':
        session_key = get_session_key(request)
        product = get_object_or_404(Product, id=product_id)
        
        quantity = 1
        if request.body:
            try:
                body = json.loads(request.body)
                quantity = int(body.get('quantity', 1))
            except:
                pass
        
        if quantity <= 0:
            return JsonResponse({'error': 'Invalid quantity'}, status=400)
            
        cart_item, created = CartItem.objects.get_or_create(
            session_key=session_key,
            product=product,
            defaults={'quantity': quantity}
        )
        if not created:
            cart_item.quantity += quantity
            cart_item.save()
            
        cart_items = CartItem.objects.filter(session_key=session_key)
        cart_count = sum(item.quantity for item in cart_items)
        
        return JsonResponse({
            'success': True,
            'message': f'Added {product.name} to cart!',
            'cart_count': cart_count
        })
    return JsonResponse({'error': 'Invalid request method'}, status=405)

def cart_update_api(request, product_id):
    if request.method == 'POST':
        session_key = get_session_key(request)
        product = get_object_or_404(Product, id=product_id)
        
        quantity = 1
        if request.body:
            try:
                body = json.loads(request.body)
                quantity = int(body.get('quantity', 1))
            except:
                pass
                
        if quantity <= 0:
            CartItem.objects.filter(session_key=session_key, product=product).delete()
        else:
            cart_item, created = CartItem.objects.get_or_create(
                session_key=session_key,
                product=product,
                defaults={'quantity': quantity}
            )
            if not created:
                cart_item.quantity = quantity
                cart_item.save()
                
        cart_items = CartItem.objects.filter(session_key=session_key)
        cart_count = sum(item.quantity for item in cart_items)
        
        return JsonResponse({
            'success': True,
            'cart_count': cart_count
        })
    return JsonResponse({'error': 'Invalid request method'}, status=405)

def cart_remove_api(request, product_id):
    if request.method == 'POST':
        session_key = get_session_key(request)
        product = get_object_or_404(Product, id=product_id)
        
        CartItem.objects.filter(session_key=session_key, product=product).delete()
        
        cart_items = CartItem.objects.filter(session_key=session_key)
        cart_count = sum(item.quantity for item in cart_items)
        
        return JsonResponse({
            'success': True,
            'cart_count': cart_count
        })
    return JsonResponse({'error': 'Invalid request method'}, status=405)

def checkout_api(request):
    if request.method == 'POST':
        session_key = get_session_key(request)
        cart_items = CartItem.objects.filter(session_key=session_key)
        
        if not cart_items.exists():
            return JsonResponse({'error': 'Your cart is empty'}, status=400)
            
        try:
            body = json.loads(request.body)
            name = body.get('name', '').strip()
            phone = body.get('phone', '').strip()
            address = body.get('address', '').strip()
            payment_method = body.get('payment_method', 'COD').strip()
            coupon_code = body.get('coupon_code', '').strip().upper()
        except:
            return JsonResponse({'error': 'Invalid request body'}, status=400)
            
        if not name or not phone or not address:
            return JsonResponse({'error': 'Please fill in all shipping details'}, status=400)
            
        discounted_total = 0
        order_items_to_create = []
        
        for item in cart_items:
            p = item.product
            price = p.discount_price if p.discount_price else p.price
            discounted_item_total = float(price) * item.quantity
            discounted_total += discounted_item_total
            order_items_to_create.append((p, item.quantity, price))
            
        coupon_discount = 0.0
        if coupon_code == 'SHOPEE50':
            coupon_discount = 0.50
        elif coupon_code == 'FREE30':
            coupon_discount = 0.30
            
        total_price = discounted_total * (1.0 - coupon_discount)
        
        order = Order.objects.create(
            name=name,
            phone=phone,
            address=address,
            payment_method=payment_method,
            total_price=total_price
        )
        
        for product, quantity, price in order_items_to_create:
            OrderItem.objects.create(
                order=order,
                product=product,
                quantity=quantity,
                price=price
            )
            product.stock = max(0, product.stock - quantity)
            product.sales_count += quantity
            product.save()
            
        cart_items.delete()
        
        return JsonResponse({
            'success': True,
            'message': 'Order placed successfully!',
            'order_id': order.id,
            'total_price': float(total_price)
        })
        
    return JsonResponse({'error': 'Invalid request method'}, status=405)

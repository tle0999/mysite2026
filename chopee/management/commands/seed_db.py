from django.core.management.base import BaseCommand
from chopee.models import Category, Product

class Command(BaseCommand):
    help = 'Seeds the database with initial categories and products'

    def handle(self, *args, **options):
        # Clear existing data
        Product.objects.all().delete()
        Category.objects.all().delete()

        # Create Categories
        cats = {
            'electronics': Category.objects.create(name='Electronics & Gadgets', slug='electronics', icon='fa-laptop'),
            'fashion': Category.objects.create(name='Fashion & Accessories', slug='fashion', icon='fa-tshirt'),
            'beauty': Category.objects.create(name='Health & Beauty', slug='beauty', icon='fa-sparkles'),
            'home': Category.objects.create(name='Home & Living', slug='home', icon='fa-couch'),
            'sports': Category.objects.create(name='Sports & Outdoors', slug='sports', icon='fa-running'),
        }

        # Create Products
        products_data = [
            # Electronics
            {
                'name': 'iPhone 15 Pro Max (256GB, Titanium Black)',
                'category': cats['electronics'],
                'price': 48900.00,
                'discount_price': 44900.00,
                'description': 'Experience the ultimate iPhone. Powered by the A17 Pro chip, featuring a lightweight aerospace-grade titanium design, and a groundbreaking 5x Telephoto camera.',
                'image': 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500&auto=format&fit=crop&q=60',
                'rating': 4.9,
                'sales_count': 142,
                'stock': 15,
                'is_flash_sale': True,
            },
            {
                'name': 'Sony WH-1000XM5 Wireless Headphones',
                'category': cats['electronics'],
                'price': 14990.00,
                'discount_price': 11490.00,
                'description': 'Industry-leading noise canceling wireless headphones with multiple mic noise canceling, auto optimizer, crystal clear hands-free calling, and Alexa voice control.',
                'image': 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500&auto=format&fit=crop&q=60',
                'rating': 4.8,
                'sales_count': 324,
                'stock': 8,
                'is_flash_sale': True,
            },
            {
                'name': 'Keychron K2 V2 Wireless Mechanical Keyboard',
                'category': cats['electronics'],
                'price': 3890.00,
                'discount_price': 3290.00,
                'description': 'A 75% layout wireless mechanical keyboard designed for maximum productivity. Hot-swappable, RGB backlit, Gateron G Pro Brown switches.',
                'image': 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=500&auto=format&fit=crop&q=60',
                'rating': 4.7,
                'sales_count': 920,
                'stock': 45,
                'is_flash_sale': False,
            },
            {
                'name': 'Smart Watch Ultra 2 with GPS',
                'category': cats['electronics'],
                'price': 9900.00,
                'discount_price': 7900.00,
                'description': 'A rugged and capable smartwatch designed for outdoor adventures. Large display, long battery life, fitness tracking, water-resistant up to 50m.',
                'image': 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=500&auto=format&fit=crop&q=60',
                'rating': 4.6,
                'sales_count': 56,
                'stock': 12,
                'is_flash_sale': True,
            },
            # Fashion
            {
                'name': "Nike Air Force 1 '07 Sneakers",
                'category': cats['fashion'],
                'price': 3700.00,
                'discount_price': 3330.00,
                'description': 'The radiance lives on in the Nike Air Force 1 \'07, the b-ball icon that puts a fresh spin on what you know best: crisp leather, bold colors and the perfect amount of flash.',
                'image': 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500&auto=format&fit=crop&q=60',
                'rating': 4.9,
                'sales_count': 2340,
                'stock': 50,
                'is_flash_sale': False,
            },
            {
                'name': 'Premium Oversized Cotton Hoodie',
                'category': cats['fashion'],
                'price': 1290.00,
                'discount_price': 690.00,
                'description': 'Ultra-soft fleece oversized hoodie, perfect for cozy days. Double-lined hood, kangaroo pocket, heavy cotton blend fabric.',
                'image': 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&auto=format&fit=crop&q=60',
                'rating': 4.5,
                'sales_count': 1890,
                'stock': 120,
                'is_flash_sale': True,
            },
            {
                'name': 'Classic Minimalist Leather Backpack',
                'category': cats['fashion'],
                'price': 2490.00,
                'discount_price': None,
                'description': 'Handcrafted genuine leather backpack. Features a padded laptop compartment, water-resistant lining, and breathable mesh back straps.',
                'image': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&auto=format&fit=crop&q=60',
                'rating': 4.8,
                'sales_count': 84,
                'stock': 25,
                'is_flash_sale': False,
            },
            # Beauty
            {
                'name': 'Hydrating Lip Glow Oil - 001 Pink',
                'category': cats['beauty'],
                'price': 1650.00,
                'discount_price': 1480.00,
                'description': 'Nourishing and color-awakening lip oil that deeply protects and enhances the lips, bringing out their natural color with a wet-look shine.',
                'image': 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=500&auto=format&fit=crop&q=60',
                'rating': 4.7,
                'sales_count': 1250,
                'stock': 60,
                'is_flash_sale': False,
            },
            {
                'name': 'Ceramide Intensive Face Moisturizer',
                'category': cats['beauty'],
                'price': 950.00,
                'discount_price': 710.00,
                'description': 'A deeply hydrating cream formulated with 5 essential ceramides and hyaluronic acid to restore and protect the skin barrier.',
                'image': 'https://images.unsplash.com/photo-1608248597481-496100c80836?w=500&auto=format&fit=crop&q=60',
                'rating': 4.9,
                'sales_count': 3240,
                'stock': 200,
                'is_flash_sale': True,
            },
            # Home
            {
                'name': 'Ergonomic Office Chair with Lumbar Support',
                'category': cats['home'],
                'price': 5900.00,
                'discount_price': 4200.00,
                'description': 'High-back desk chair featuring breathable mesh back, adjustable headrest and 3D armrests. Perfect for long hours of working or studying.',
                'image': 'https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=500&auto=format&fit=crop&q=60',
                'rating': 4.6,
                'sales_count': 412,
                'stock': 18,
                'is_flash_sale': False,
            },
            {
                'name': 'Premium Drip Coffee Maker',
                'category': cats['home'],
                'price': 3490.00,
                'discount_price': 2790.00,
                'description': 'Programmable 12-cup coffee maker with strength control, thermal carafe, and dynamic pre-infusion cycle for optimal coffee flavor extraction.',
                'image': 'https://images.unsplash.com/photo-1517256064527-09c53b2d0bc6?w=500&auto=format&fit=crop&q=60',
                'rating': 4.7,
                'sales_count': 118,
                'stock': 14,
                'is_flash_sale': True,
            },
            # Sports
            {
                'name': 'Double-Wall Vacuum Insulated Water Bottle (32oz)',
                'category': cats['sports'],
                'price': 1190.00,
                'discount_price': 890.00,
                'description': 'Stainless steel sports water bottle with leak-proof straw lid. Keeps drinks ice cold for 24 hours or piping hot for 12 hours.',
                'image': 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&auto=format&fit=crop&q=60',
                'rating': 4.8,
                'sales_count': 780,
                'stock': 85,
                'is_flash_sale': False,
            }
        ]

        for p in products_data:
            Product.objects.create(**p)

        self.stdout.write(self.style.SUCCESS('Successfully seeded categories and products!'))

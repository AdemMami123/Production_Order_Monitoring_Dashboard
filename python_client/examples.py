"""
Example Usage of Odoo Python Client
====================================

This script demonstrates how to use the Odoo Python client for common operations.

Make sure to set environment variables:
- ODOO_URL
- ODOO_DB
- ODOO_USERNAME
- ODOO_API_KEY

Or create a .env file and load it with python-dotenv
"""

import os
import sys
from datetime import datetime, timedelta

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from python_client.odoo_client import OdooClient, create_client, OdooAPIError


def example_1_basic_connection():
    """Example 1: Basic connection and version check"""
    print("\n" + "="*60)
    print("Example 1: Basic Connection")
    print("="*60)
    
    try:
        # Create client (loads credentials from environment variables)
        client = OdooClient()
        
        # Test connection
        client.test_connection()
        
        # Get version
        version = client.get_version()
        print(f"\nOdoo Version: {version['server_version']}")
        print(f"Server Series: {version['server_serie']}")
        
    except OdooAPIError as e:
        print(f"Error: {e}")


def example_2_manufacturing_orders():
    """Example 2: Working with Manufacturing Orders"""
    print("\n" + "="*60)
    print("Example 2: Manufacturing Orders")
    print("="*60)
    
    try:
        client = create_client()  # Creates and authenticates automatically
        
        # Search for confirmed manufacturing orders
        print("\n1. Searching for confirmed manufacturing orders...")
        mos = client.search_manufacturing_orders(
            domain=[('state', '=', 'confirmed')],
            limit=5
        )
        
        print(f"Found {len(mos)} confirmed MO(s)")
        for mo in mos:
            print(f"  - {mo['name']}: {mo['product_id'][1]} (Qty: {mo['product_qty']})")
        
        # Get all MOs in progress
        print("\n2. Searching for MOs in progress...")
        mos_in_progress = client.search_manufacturing_orders(
            domain=[('state', '=', 'progress')],
            limit=5
        )
        
        print(f"Found {len(mos_in_progress)} MO(s) in progress")
        for mo in mos_in_progress:
            print(f"  - {mo['name']}: Produced {mo['qty_produced']}/{mo['product_qty']}")
        
        # If you want to create a new MO (uncomment to test)
        # print("\n3. Creating a new manufacturing order...")
        # new_mo_id = client.create_manufacturing_order(
        #     product_id=1,  # Replace with actual product ID
        #     product_qty=10,
        #     date_deadline=(datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d %H:%M:%S'),
        #     origin='Python Client Test'
        # )
        # print(f"Created MO with ID: {new_mo_id}")
        
        # Get details of first MO if exists
        if mos:
            print(f"\n4. Getting details of MO: {mos[0]['name']}")
            mo_detail = client.get_manufacturing_order(mos[0]['id'])
            print(f"  Product: {mo_detail['product_id'][1]}")
            print(f"  State: {mo_detail['state']}")
            print(f"  Deadline: {mo_detail['date_deadline']}")
            print(f"  Quantity: {mo_detail['product_qty']}")
        
    except OdooAPIError as e:
        print(f"Error: {e}")


def example_3_products():
    """Example 3: Working with Products"""
    print("\n" + "="*60)
    print("Example 3: Products")
    print("="*60)
    
    try:
        client = create_client()
        
        # Search for active products
        print("\n1. Searching for active products...")
        products = client.search_products(
            domain=[('active', '=', True)],
            limit=10
        )
        
        print(f"Found {len(products)} active product(s)")
        for product in products[:5]:  # Show first 5
            print(f"  - {product['name']} ({product.get('default_code', 'N/A')})")
            print(f"    Price: ${product['list_price']}, Stock: {product['qty_available']}")
        
        # Search for products in a specific category (if you have categories)
        # print("\n2. Searching for products in category...")
        # products_in_cat = client.search_products(
        #     domain=[('categ_id', '=', 1)],  # Replace with actual category ID
        #     limit=5
        # )
        
        # Get details of first product if exists
        if products:
            print(f"\n3. Getting details of product: {products[0]['name']}")
            product_detail = client.get_product(products[0]['id'])
            print(f"  Name: {product_detail['name']}")
            print(f"  Type: {product_detail['type']}")
            print(f"  Sale Price: ${product_detail['list_price']}")
            print(f"  Cost: ${product_detail['standard_price']}")
            print(f"  Available: {product_detail['qty_available']}")
            print(f"  Virtual Available: {product_detail['virtual_available']}")
        
        # Create a new product (uncomment to test)
        # print("\n4. Creating a new product...")
        # new_product_id = client.create_product(
        #     name='Test Product from Python',
        #     type='product',
        #     list_price=99.99,
        #     standard_price=50.00,
        #     default_code='PYTEST-001'
        # )
        # print(f"Created product with ID: {new_product_id}")
        
    except OdooAPIError as e:
        print(f"Error: {e}")


def example_4_users():
    """Example 4: Working with Users"""
    print("\n" + "="*60)
    print("Example 4: Users")
    print("="*60)
    
    try:
        client = create_client()
        
        # Search for active users
        print("\n1. Searching for active users...")
        users = client.search_users(
            domain=[('active', '=', True)],
            limit=10
        )
        
        print(f"Found {len(users)} active user(s)")
        for user in users[:5]:  # Show first 5
            print(f"  - {user['name']} ({user['login']})")
            print(f"    Email: {user.get('email', 'N/A')}")
        
        # Get current user info
        if client.uid:
            print(f"\n2. Getting current user info (UID: {client.uid})...")
            current_user = client.get_user(client.uid)
            print(f"  Name: {current_user['name']}")
            print(f"  Login: {current_user['login']}")
            print(f"  Email: {current_user.get('email', 'N/A')}")
            print(f"  Company: {current_user['company_id'][1] if current_user.get('company_id') else 'N/A'}")
        
    except OdooAPIError as e:
        print(f"Error: {e}")


def example_5_generic_operations():
    """Example 5: Generic CRUD operations on any model"""
    print("\n" + "="*60)
    print("Example 5: Generic CRUD Operations")
    print("="*60)
    
    try:
        client = create_client()
        
        # Search for records
        print("\n1. Using generic search...")
        partner_ids = client.search(
            'res.partner',
            domain=[('is_company', '=', True)],
            limit=5
        )
        print(f"Found {len(partner_ids)} company partner ID(s): {partner_ids}")
        
        # Read records
        if partner_ids:
            print("\n2. Using generic read...")
            partners = client.read(
                'res.partner',
                partner_ids[:3],  # Read first 3
                fields=['id', 'name', 'email', 'phone']
            )
            
            print(f"Read {len(partners)} partner(s):")
            for partner in partners:
                print(f"  - {partner['name']}")
                print(f"    Email: {partner.get('email', 'N/A')}")
                print(f"    Phone: {partner.get('phone', 'N/A')}")
        
        # Search and read in one call
        print("\n3. Using generic search_read...")
        partners = client.search_read(
            'res.partner',
            domain=[('is_company', '=', True)],
            fields=['id', 'name', 'city', 'country_id'],
            limit=5
        )
        
        print(f"Found {len(partners)} partner(s):")
        for partner in partners:
            print(f"  - {partner['name']}: {partner.get('city', 'N/A')}, {partner['country_id'][1] if partner.get('country_id') else 'N/A'}")
        
    except OdooAPIError as e:
        print(f"Error: {e}")


def example_6_xmlrpc_protocol():
    """Example 6: Using XML-RPC instead of JSON-RPC"""
    print("\n" + "="*60)
    print("Example 6: XML-RPC Protocol")
    print("="*60)
    
    try:
        # Create client with XML-RPC protocol
        client = OdooClient(protocol='xmlrpc')
        
        # Test connection
        client.test_connection()
        
        # Get version
        version = client.get_version()
        print(f"\nOdoo Version (via XML-RPC): {version['server_version']}")
        
        # Search products
        products = client.search_products(limit=5)
        print(f"\nFound {len(products)} product(s) using XML-RPC")
        for product in products[:3]:
            print(f"  - {product['name']}")
        
    except OdooAPIError as e:
        print(f"Error: {e}")


def example_7_error_handling():
    """Example 7: Error handling examples"""
    print("\n" + "="*60)
    print("Example 7: Error Handling")
    print("="*60)
    
    try:
        client = create_client()
        
        # Try to get a non-existent product
        print("\n1. Trying to get non-existent product (ID: 999999)...")
        try:
            product = client.get_product(999999)
        except OdooAPIError as e:
            print(f"✓ Caught error: {e}")
        
        # Try to create with invalid data
        print("\n2. Trying to create manufacturing order with invalid product...")
        try:
            mo_id = client.create_manufacturing_order(
                product_id=999999,  # Invalid product
                product_qty=10
            )
        except OdooAPIError as e:
            print(f"✓ Caught error: {e}")
        
        print("\n✓ Error handling works correctly!")
        
    except OdooAPIError as e:
        print(f"Error: {e}")


def main():
    """Run all examples"""
    print("\n" + "="*60)
    print("Odoo Python Client - Usage Examples")
    print("="*60)
    print("\nMake sure you have set the following environment variables:")
    print("  - ODOO_URL")
    print("  - ODOO_DB")
    print("  - ODOO_USERNAME")
    print("  - ODOO_API_KEY")
    print("\nOr they are in your .env file")
    
    # Check if environment variables are set
    required = ['ODOO_URL', 'ODOO_DB', 'ODOO_USERNAME', 'ODOO_API_KEY']
    missing = [var for var in required if not os.getenv(var)]
    
    if missing:
        print(f"\n⚠ WARNING: Missing environment variables: {', '.join(missing)}")
        print("Examples may fail without proper configuration.\n")
    
    # Run examples
    try:
        example_1_basic_connection()
        example_2_manufacturing_orders()
        example_3_products()
        example_4_users()
        example_5_generic_operations()
        example_6_xmlrpc_protocol()
        example_7_error_handling()
        
        print("\n" + "="*60)
        print("All examples completed!")
        print("="*60 + "\n")
        
    except KeyboardInterrupt:
        print("\n\nExamples interrupted by user.")
    except Exception as e:
        print(f"\n\nUnexpected error: {e}")


if __name__ == '__main__':
    # Optional: Load from .env file if using python-dotenv
    try:
        from dotenv import load_dotenv
        # Look for .env in backend folder
        env_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            'backend',
            '.env'
        )
        if os.path.exists(env_path):
            load_dotenv(env_path)
            print(f"✓ Loaded environment from: {env_path}")
    except ImportError:
        print("⚠ python-dotenv not installed. Using system environment variables.")
        print("  Install with: pip install python-dotenv")
    
    main()


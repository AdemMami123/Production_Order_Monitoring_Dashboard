"""
Odoo API Client - Python Integration
=====================================

A minimal and reusable Python client for Odoo ERP integration using JSON-RPC.

Features:
- JSON-RPC and XML-RPC support
- API key authentication (secure)
- Environment variable configuration
- Comprehensive error handling
- Manufacturing orders (mrp.production) management
- Product (product.product) management
- User (res.users) management
- Connection and authentication error catching
- Detailed logging

Author: Production Orders Monitoring Dashboard
Version: 1.0.0
"""

import os
import json
import logging
import requests
import xmlrpc.client
from typing import Dict, List, Any, Optional, Union
from urllib.parse import urljoin

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] [%(levelname)s] [ODOO] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)


class OdooAPIError(Exception):
    """Custom exception for Odoo API errors"""
    pass


class OdooClient:
    """
    Odoo API Client with JSON-RPC and XML-RPC support
    
    Example usage:
        >>> from odoo_client import OdooClient
        >>> client = OdooClient()
        >>> client.authenticate()
        >>> products = client.search_products([('active', '=', True)], limit=10)
    """
    
    def __init__(
        self,
        url: Optional[str] = None,
        db: Optional[str] = None,
        username: Optional[str] = None,
        api_key: Optional[str] = None,
        protocol: str = 'jsonrpc'
    ):
        """
        Initialize Odoo client with credentials from environment variables or parameters
        
        Args:
            url: Odoo instance URL (default: from ODOO_URL env var)
            db: Database name (default: from ODOO_DB env var)
            username: Username/email (default: from ODOO_USERNAME env var)
            api_key: API key (default: from ODOO_API_KEY env var)
            protocol: 'jsonrpc' or 'xmlrpc' (default: jsonrpc)
        """
        # Load from environment variables or use provided values
        self.url = url or os.getenv('ODOO_URL')
        self.db = db or os.getenv('ODOO_DB')
        self.username = username or os.getenv('ODOO_USERNAME')
        self.api_key = api_key or os.getenv('ODOO_API_KEY')
        self.protocol = protocol.lower()
        
        # User ID (set after authentication)
        self.uid = None
        
        # Validate configuration
        self._validate_config()
        
        # Setup protocol-specific clients
        if self.protocol == 'jsonrpc':
            self.session = requests.Session()
            self.session.headers.update({'Content-Type': 'application/json'})
        elif self.protocol == 'xmlrpc':
            self.common = xmlrpc.client.ServerProxy(f'{self.url}/xmlrpc/2/common')
            self.models = xmlrpc.client.ServerProxy(f'{self.url}/xmlrpc/2/object')
        else:
            raise ValueError(f"Unsupported protocol: {self.protocol}. Use 'jsonrpc' or 'xmlrpc'")
        
        logger.info(f"Odoo client initialized with {self.protocol.upper()} protocol")
        logger.info(f"URL: {self.url}, DB: {self.db}, User: {self.username}")
    
    def _validate_config(self):
        """Validate that all required configuration is present"""
        required = {
            'ODOO_URL': self.url,
            'ODOO_DB': self.db,
            'ODOO_USERNAME': self.username,
            'ODOO_API_KEY': self.api_key
        }
        
        missing = [key for key, value in required.items() if not value]
        
        if missing:
            raise OdooAPIError(
                f"Missing required configuration: {', '.join(missing)}\n"
                "Set environment variables or pass values to constructor."
            )
        
        # Validate URL format
        if not self.url.startswith(('http://', 'https://')):
            raise OdooAPIError(
                f"Invalid URL format: {self.url}\n"
                "URL must start with http:// or https://"
            )
        
        # Security warning for HTTP
        if self.url.startswith('http://') and 'localhost' not in self.url:
            logger.warning(
                "WARNING: Using HTTP instead of HTTPS for production is insecure!"
            )
    
    def _jsonrpc_call(self, endpoint: str, params: Dict[str, Any]) -> Any:
        """
        Make a JSON-RPC call to Odoo
        
        Args:
            endpoint: API endpoint (e.g., '/jsonrpc')
            params: Request parameters
            
        Returns:
            API response result
            
        Raises:
            OdooAPIError: If request fails
        """
        url = urljoin(self.url, endpoint)
        payload = {
            'jsonrpc': '2.0',
            'method': 'call',
            'params': params,
            'id': 1
        }
        
        try:
            logger.debug(f"JSON-RPC call to {endpoint}: {json.dumps(params, indent=2)}")
            response = self.session.post(url, json=payload, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            
            # Check for JSON-RPC error
            if 'error' in data:
                error = data['error']
                error_msg = error.get('data', {}).get('message') or error.get('message', 'Unknown error')
                raise OdooAPIError(f"JSON-RPC Error: {error_msg}")
            
            logger.debug(f"JSON-RPC call successful")
            return data.get('result')
            
        except requests.exceptions.RequestException as e:
            raise OdooAPIError(f"HTTP Request failed: {str(e)}")
        except json.JSONDecodeError as e:
            raise OdooAPIError(f"Invalid JSON response: {str(e)}")
    
    def _xmlrpc_call(self, service: str, method: str, *args) -> Any:
        """
        Make an XML-RPC call to Odoo
        
        Args:
            service: 'common' or 'object'
            method: Method name
            *args: Method arguments
            
        Returns:
            API response result
            
        Raises:
            OdooAPIError: If request fails
        """
        try:
            if service == 'common':
                result = getattr(self.common, method)(*args)
            elif service == 'object':
                result = getattr(self.models, method)(*args)
            else:
                raise ValueError(f"Invalid service: {service}")
            
            return result
            
        except xmlrpc.client.Fault as e:
            raise OdooAPIError(f"XML-RPC Fault: {str(e)}")
        except Exception as e:
            raise OdooAPIError(f"XML-RPC Error: {str(e)}")
    
    def authenticate(self) -> int:
        """
        Authenticate with Odoo using API key
        
        Returns:
            User ID (uid)
            
        Raises:
            OdooAPIError: If authentication fails
        """
        try:
            logger.info(f"Authenticating user: {self.username}")
            
            if self.protocol == 'jsonrpc':
                result = self._jsonrpc_call('/jsonrpc', {
                    'service': 'common',
                    'method': 'authenticate',
                    'args': [self.db, self.username, self.api_key, {}]
                })
            else:  # xmlrpc
                result = self._xmlrpc_call('common', 'authenticate', 
                                          self.db, self.username, self.api_key, {})
            
            if not result:
                raise OdooAPIError(
                    "Authentication failed: Invalid credentials\n"
                    "Check:\n"
                    "- ODOO_USERNAME is correct\n"
                    "- ODOO_API_KEY is valid and active\n"
                    "- User has API access enabled\n"
                    "- Database name is correct"
                )
            
            self.uid = result
            logger.info(f"Authentication successful. User ID: {self.uid}")
            return self.uid
            
        except OdooAPIError:
            raise
        except Exception as e:
            raise OdooAPIError(f"Authentication error: {str(e)}")
    
    def execute(
        self,
        model: str,
        method: str,
        args: List[Any] = None,
        kwargs: Dict[str, Any] = None
    ) -> Any:
        """
        Execute a method on an Odoo model
        
        Args:
            model: Model name (e.g., 'mrp.production')
            method: Method name (e.g., 'search_read')
            args: Positional arguments
            kwargs: Keyword arguments
            
        Returns:
            Method result
            
        Raises:
            OdooAPIError: If execution fails
        """
        # Ensure authenticated
        if not self.uid:
            self.authenticate()
        
        args = args or []
        kwargs = kwargs or {}
        
        try:
            logger.debug(f"Executing {model}.{method}")
            
            if self.protocol == 'jsonrpc':
                result = self._jsonrpc_call('/jsonrpc', {
                    'service': 'object',
                    'method': 'execute_kw',
                    'args': [self.db, self.uid, self.api_key, model, method, args, kwargs]
                })
            else:  # xmlrpc
                result = self._xmlrpc_call('object', 'execute_kw',
                                          self.db, self.uid, self.api_key,
                                          model, method, args, kwargs)
            
            logger.debug(f"{model}.{method} executed successfully")
            return result
            
        except OdooAPIError:
            raise
        except Exception as e:
            raise OdooAPIError(f"Execution error on {model}.{method}: {str(e)}")
    
    # ==================== Generic CRUD Operations ====================
    
    def search(
        self,
        model: str,
        domain: List[tuple] = None,
        limit: int = 100,
        offset: int = 0,
        order: str = ''
    ) -> List[int]:
        """
        Search for record IDs
        
        Args:
            model: Model name
            domain: Search domain (filters)
            limit: Maximum records
            offset: Skip records
            order: Sort order
            
        Returns:
            List of record IDs
        """
        domain = domain or []
        kwargs = {}
        if limit: kwargs['limit'] = limit
        if offset: kwargs['offset'] = offset
        if order: kwargs['order'] = order
        
        return self.execute(model, 'search', [domain], kwargs)
    
    def read(
        self,
        model: str,
        ids: List[int],
        fields: List[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Read records by IDs
        
        Args:
            model: Model name
            ids: Record IDs
            fields: Fields to retrieve (None = all)
            
        Returns:
            List of record dictionaries
        """
        kwargs = {}
        if fields: kwargs['fields'] = fields
        
        return self.execute(model, 'read', [ids], kwargs)
    
    def search_read(
        self,
        model: str,
        domain: List[tuple] = None,
        fields: List[str] = None,
        limit: int = 100,
        offset: int = 0,
        order: str = ''
    ) -> List[Dict[str, Any]]:
        """
        Search and read records in one call
        
        Args:
            model: Model name
            domain: Search domain
            fields: Fields to retrieve
            limit: Maximum records
            offset: Skip records
            order: Sort order
            
        Returns:
            List of record dictionaries
        """
        domain = domain or []
        kwargs = {}
        if fields: kwargs['fields'] = fields
        if limit: kwargs['limit'] = limit
        if offset: kwargs['offset'] = offset
        if order: kwargs['order'] = order
        
        return self.execute(model, 'search_read', [domain], kwargs)
    
    def create(self, model: str, values: Dict[str, Any]) -> int:
        """
        Create a new record
        
        Args:
            model: Model name
            values: Record values
            
        Returns:
            New record ID
        """
        return self.execute(model, 'create', [values])
    
    def write(self, model: str, ids: List[int], values: Dict[str, Any]) -> bool:
        """
        Update existing records
        
        Args:
            model: Model name
            ids: Record IDs to update
            values: Values to update
            
        Returns:
            True if successful
        """
        return self.execute(model, 'write', [ids, values])
    
    def unlink(self, model: str, ids: List[int]) -> bool:
        """
        Delete records
        
        Args:
            model: Model name
            ids: Record IDs to delete
            
        Returns:
            True if successful
        """
        return self.execute(model, 'unlink', [ids])
    
    # ==================== Manufacturing Orders (mrp.production) ====================
    
    def search_manufacturing_orders(
        self,
        domain: List[tuple] = None,
        fields: List[str] = None,
        limit: int = 100,
        offset: int = 0,
        order: str = 'date_deadline desc'
    ) -> List[Dict[str, Any]]:
        """
        Search manufacturing orders
        
        Args:
            domain: Filters (e.g., [('state', '=', 'confirmed')])
            fields: Fields to retrieve
            limit: Maximum records
            offset: Skip records
            order: Sort order
            
        Returns:
            List of manufacturing order records
        """
        if fields is None:
            fields = [
                'id', 'name', 'product_id', 'product_qty', 'product_uom_id',
                'state', 'date_planned_start', 'date_deadline', 'priority',
                'user_id', 'company_id', 'origin', 'qty_produced', 'qty_producing'
            ]
        
        logger.info(f"Searching manufacturing orders with domain: {domain}")
        result = self.search_read('mrp.production', domain, fields, limit, offset, order)
        logger.info(f"Found {len(result)} manufacturing order(s)")
        return result
    
    def get_manufacturing_order(self, mo_id: int, fields: List[str] = None) -> Dict[str, Any]:
        """
        Get a specific manufacturing order
        
        Args:
            mo_id: Manufacturing order ID
            fields: Fields to retrieve
            
        Returns:
            Manufacturing order record
        """
        if fields is None:
            fields = [
                'id', 'name', 'product_id', 'product_qty', 'product_uom_id',
                'state', 'date_planned_start', 'date_deadline', 'priority',
                'user_id', 'company_id', 'origin', 'qty_produced', 'qty_producing',
                'bom_id', 'move_raw_ids', 'move_finished_ids'
            ]
        
        logger.info(f"Getting manufacturing order ID: {mo_id}")
        result = self.read('mrp.production', [mo_id], fields)
        
        if not result:
            raise OdooAPIError(f"Manufacturing order {mo_id} not found")
        
        return result[0]
    
    def create_manufacturing_order(
        self,
        product_id: int,
        product_qty: float,
        date_planned_start: str = None,
        date_deadline: str = None,
        origin: str = None,
        **kwargs
    ) -> int:
        """
        Create a new manufacturing order
        
        Args:
            product_id: Product ID to manufacture
            product_qty: Quantity to produce
            date_planned_start: Planned start date (YYYY-MM-DD HH:MM:SS)
            date_deadline: Deadline date (YYYY-MM-DD HH:MM:SS)
            origin: Source reference
            **kwargs: Additional fields
            
        Returns:
            New manufacturing order ID
        """
        values = {
            'product_id': product_id,
            'product_qty': product_qty,
        }
        
        if date_planned_start: values['date_planned_start'] = date_planned_start
        if date_deadline: values['date_deadline'] = date_deadline
        if origin: values['origin'] = origin
        
        # Add any additional fields
        values.update(kwargs)
        
        logger.info(f"Creating manufacturing order for product {product_id}, qty: {product_qty}")
        mo_id = self.create('mrp.production', values)
        logger.info(f"Manufacturing order created with ID: {mo_id}")
        
        return mo_id
    
    def update_manufacturing_order(
        self,
        mo_id: int,
        values: Dict[str, Any]
    ) -> bool:
        """
        Update a manufacturing order
        
        Args:
            mo_id: Manufacturing order ID
            values: Fields to update
            
        Returns:
            True if successful
        """
        logger.info(f"Updating manufacturing order {mo_id}")
        result = self.write('mrp.production', [mo_id], values)
        logger.info(f"Manufacturing order {mo_id} updated successfully")
        
        return result
    
    # ==================== Products (product.product) ====================
    
    def search_products(
        self,
        domain: List[tuple] = None,
        fields: List[str] = None,
        limit: int = 100,
        offset: int = 0,
        order: str = 'name'
    ) -> List[Dict[str, Any]]:
        """
        Search products
        
        Args:
            domain: Filters (e.g., [('active', '=', True)])
            fields: Fields to retrieve
            limit: Maximum records
            offset: Skip records
            order: Sort order
            
        Returns:
            List of product records
        """
        if fields is None:
            fields = [
                'id', 'name', 'default_code', 'barcode', 'list_price',
                'standard_price', 'type', 'categ_id', 'uom_id',
                'qty_available', 'virtual_available', 'description', 'active'
            ]
        
        logger.info(f"Searching products with domain: {domain}")
        result = self.search_read('product.product', domain, fields, limit, offset, order)
        logger.info(f"Found {len(result)} product(s)")
        return result
    
    def get_product(self, product_id: int, fields: List[str] = None) -> Dict[str, Any]:
        """
        Get a specific product
        
        Args:
            product_id: Product ID
            fields: Fields to retrieve
            
        Returns:
            Product record
        """
        if fields is None:
            fields = [
                'id', 'name', 'default_code', 'barcode', 'list_price',
                'standard_price', 'type', 'categ_id', 'uom_id',
                'qty_available', 'virtual_available', 'description', 'active'
            ]
        
        logger.info(f"Getting product ID: {product_id}")
        result = self.read('product.product', [product_id], fields)
        
        if not result:
            raise OdooAPIError(f"Product {product_id} not found")
        
        return result[0]
    
    def create_product(
        self,
        name: str,
        type: str = 'product',
        list_price: float = 0.0,
        standard_price: float = 0.0,
        **kwargs
    ) -> int:
        """
        Create a new product
        
        Args:
            name: Product name
            type: Product type ('product', 'consu', 'service')
            list_price: Sales price
            standard_price: Cost price
            **kwargs: Additional fields
            
        Returns:
            New product ID
        """
        values = {
            'name': name,
            'type': type,
            'list_price': list_price,
            'standard_price': standard_price,
        }
        
        # Add any additional fields
        values.update(kwargs)
        
        logger.info(f"Creating product: {name}")
        product_id = self.create('product.product', values)
        logger.info(f"Product created with ID: {product_id}")
        
        return product_id
    
    # ==================== Users (res.users) ====================
    
    def search_users(
        self,
        domain: List[tuple] = None,
        fields: List[str] = None,
        limit: int = 100,
        offset: int = 0,
        order: str = 'name'
    ) -> List[Dict[str, Any]]:
        """
        Search users
        
        Args:
            domain: Filters (e.g., [('active', '=', True)])
            fields: Fields to retrieve
            limit: Maximum records
            offset: Skip records
            order: Sort order
            
        Returns:
            List of user records
        """
        if fields is None:
            fields = [
                'id', 'name', 'login', 'email', 'active',
                'company_id', 'groups_id', 'lang'
            ]
        
        logger.info(f"Searching users with domain: {domain}")
        result = self.search_read('res.users', domain, fields, limit, offset, order)
        logger.info(f"Found {len(result)} user(s)")
        return result
    
    def get_user(self, user_id: int, fields: List[str] = None) -> Dict[str, Any]:
        """
        Get a specific user
        
        Args:
            user_id: User ID
            fields: Fields to retrieve
            
        Returns:
            User record
        """
        if fields is None:
            fields = [
                'id', 'name', 'login', 'email', 'active',
                'company_id', 'groups_id', 'lang'
            ]
        
        logger.info(f"Getting user ID: {user_id}")
        result = self.read('res.users', [user_id], fields)
        
        if not result:
            raise OdooAPIError(f"User {user_id} not found")
        
        return result[0]
    
    def create_user(
        self,
        name: str,
        login: str,
        email: str = None,
        **kwargs
    ) -> int:
        """
        Create a new user
        
        Args:
            name: User name
            login: Login username
            email: Email address
            **kwargs: Additional fields
            
        Returns:
            New user ID
        """
        values = {
            'name': name,
            'login': login,
        }
        
        if email: values['email'] = email
        
        # Add any additional fields
        values.update(kwargs)
        
        logger.info(f"Creating user: {name} ({login})")
        user_id = self.create('res.users', values)
        logger.info(f"User created with ID: {user_id}")
        
        return user_id
    
    # ==================== Utility Methods ====================
    
    def get_version(self) -> Dict[str, Any]:
        """
        Get Odoo version information
        
        Returns:
            Version information dictionary
        """
        try:
            if self.protocol == 'jsonrpc':
                result = self._jsonrpc_call('/jsonrpc', {
                    'service': 'common',
                    'method': 'version',
                    'args': []
                })
            else:  # xmlrpc
                result = self._xmlrpc_call('common', 'version')
            
            logger.info(f"Odoo version: {result.get('server_version', 'Unknown')}")
            return result
            
        except Exception as e:
            raise OdooAPIError(f"Failed to get version: {str(e)}")
    
    def test_connection(self) -> bool:
        """
        Test the connection to Odoo
        
        Returns:
            True if connection and authentication successful
        """
        try:
            logger.info("Testing Odoo connection...")
            
            # Get version
            version = self.get_version()
            logger.info(f"Connected to Odoo {version.get('server_version', 'Unknown')}")
            
            # Authenticate
            self.authenticate()
            
            logger.info("✓ Connection test successful!")
            return True
            
        except Exception as e:
            logger.error(f"✗ Connection test failed: {str(e)}")
            return False


# Convenience function for quick client creation
def create_client(protocol: str = 'jsonrpc') -> OdooClient:
    """
    Create and authenticate an Odoo client using environment variables
    
    Args:
        protocol: 'jsonrpc' or 'xmlrpc'
        
    Returns:
        Authenticated OdooClient instance
    """
    client = OdooClient(protocol=protocol)
    client.authenticate()
    return client


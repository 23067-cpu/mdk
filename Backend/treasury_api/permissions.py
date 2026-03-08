from rest_framework import permissions


class IsAdmin(permissions.BasePermission):
    """Allow access only to Admin users"""
    
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'ADMIN'


class IsGerantOrAdmin(permissions.BasePermission):
    """Allow access to Gérant and Admin users"""
    
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['ADMIN', 'GERANT']


class IsCaissierOrAbove(permissions.BasePermission):
    """Allow access to Caissier, Gérant, and Admin users"""
    
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['ADMIN', 'GERANT', 'CAISSIER']

class CanManageFolio(permissions.BasePermission):
    """Permission to manage Folios - create, open, close"""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Read operations allowed for everyone
        if request.method in permissions.SAFE_METHODS:
            return request.user.role in ['ADMIN', 'GERANT', 'CAISSIER']
        
        # Write operations
        return request.user.role in ['ADMIN', 'GERANT', 'CAISSIER']
    
    def has_object_permission(self, request, view, obj):
        # Admin can do anything
        if request.user.role == 'ADMIN':
            return True
        
        # Gérant can manage folios in their branch
        if request.user.role == 'GERANT':
            if obj.branch and request.user.branch:
                return obj.branch == request.user.branch
            return True
        
        # Caissier can only view and add transactions to their assigned folios
        if request.user.role == 'CAISSIER':
            if request.method in permissions.SAFE_METHODS:
                return True
            # Can modify if they are assigned to this folio
            return obj.assigned_users.filter(id=request.user.id).exists()
        
        return False


class CanManageTransaction(permissions.BasePermission):
    """Permission to manage Transactions"""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        allowed_roles = ['ADMIN', 'GERANT', 'CAISSIER']
        return request.user.role in allowed_roles
    
    def has_object_permission(self, request, view, obj):
        # Admin can do anything
        if request.user.role == 'ADMIN':
            return True
        
        # Gérant can manage transactions in their branch
        if request.user.role == 'GERANT':
            if obj.folio.branch and request.user.branch:
                return obj.folio.branch == request.user.branch
            return True
        
        # Others can only view and modify their own transactions
        if request.method in permissions.SAFE_METHODS:
            return True
        
        return obj.created_by == request.user


class CanApprove(permissions.BasePermission):
    """Permission to approve settlements, closures, etc."""
    
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['ADMIN', 'GERANT']


class CanVoidTransaction(permissions.BasePermission):
    """Permission to void transactions"""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Admin can void directly
        if request.user.role == 'ADMIN':
            return True
        
        # Gérant can void with reason
        if request.user.role == 'GERANT':
            return True
        
        # Caissier can request void (needs approval)
        if request.user.role == 'CAISSIER':
            return True
        
        return False


class CanManageUsers(permissions.BasePermission):
    """Permission to manage users - Admin and Gérant"""
    
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['ADMIN', 'GERANT']
    
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'ADMIN':
            return True
        
        if request.user.role == 'GERANT':
            # Gérants can only manage Caissiers
            if obj.role != 'CAISSIER':
                return False
            
            # If the Gérant is assigned to a specific branch, they can only manage users in that branch
            if request.user.branch and obj.branch != request.user.branch:
                return False
                
            return True
            
        return False


class CanManageSettings(permissions.BasePermission):
    """Permission to manage system settings - Admin only"""
    
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'ADMIN'


class CanViewAuditLogs(permissions.BasePermission):
    """Permission to view audit logs"""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Admin can view all
        if request.user.role == 'ADMIN':
            return True
        
        # Gérant can view branch audit logs
        if request.user.role == 'GERANT':
            return True
        
        return False


class CanExportReports(permissions.BasePermission):
    """Permission to export reports"""
    
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['ADMIN', 'GERANT', 'CAISSIER']

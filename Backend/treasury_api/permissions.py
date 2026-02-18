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


class IsSaisieClientOrAdmin(permissions.BasePermission):
    """Allow access to Saisie Règlement Client and Admin users"""
    
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['ADMIN', 'SAISIE_CLIENT']


class IsSaisieFournisseurOrAdmin(permissions.BasePermission):
    """Allow access to Saisie Règlement Fournisseurs and Admin users"""
    
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['ADMIN', 'SAISIE_FOURNISSEUR']


class IsSaisieOrAbove(permissions.BasePermission):
    """Allow access to any Saisie role, Caissier, Gérant, and Admin"""
    
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in [
            'ADMIN', 'GERANT', 'CAISSIER', 'SAISIE_CLIENT', 'SAISIE_FOURNISSEUR'
        ]


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
        
        # Caissier can only view and add transactions to their own folios
        if request.user.role == 'CAISSIER':
            if request.method in permissions.SAFE_METHODS:
                return True
            # Can only modify folios they opened
            return obj.opened_by == request.user
        
        return False


class CanManageTransaction(permissions.BasePermission):
    """Permission to manage Transactions"""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        allowed_roles = ['ADMIN', 'GERANT', 'CAISSIER', 'SAISIE_CLIENT', 'SAISIE_FOURNISSEUR']
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
    """Permission to manage users - Admin only"""
    
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'ADMIN'


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

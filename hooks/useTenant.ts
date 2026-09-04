'use client';
import { useState, useEffect } from 'react';
import { apiCall } from '@/lib/api';

export function useTenant() {
  const [displayName, setDisplayName] = useState('User');
  const [tenantName, setTenantName] = useState('Account');
  const [primaryColor, setPrimaryColor] = useState('#2D1B4E');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedName = localStorage.getItem('user_full_name');
    const savedTenant = localStorage.getItem('tenant_name');
    
    if (savedName) setDisplayName(savedName);
    if (savedTenant) setTenantName(savedTenant);

    apiCall('/v1/tenants/tenants/current/', { requiresAuth: true })
      .then((data) => {
        if (!data) return;
        const tenantObj = Array.isArray(data) ? data[0] : data.results?.[0] || data;
        
        if (tenantObj) {
          if (tenantObj.name) {
            setTenantName(tenantObj.name);
            localStorage.setItem('tenant_name', tenantObj.name);
          }
          if (tenantObj.effective_primary_color) {
            setPrimaryColor(tenantObj.effective_primary_color);
          }
        }
      })
      .catch((err) => console.error('Error loading tenant details:', err))
      .finally(() => setLoading(false));
  }, []);

  return { displayName, tenantName, primaryColor, loading, userInitial: displayName.charAt(0).toUpperCase() };
}
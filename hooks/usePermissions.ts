// C:\Users\allan.muyesu\Desktop\my-app\hooks\usePermissions.ts
'use client';
import { useState, useEffect } from 'react';

export function usePermissions() {
  const [permissions, setPermissions] = useState<any[]>([]);

  useEffect(() => {
    const storedPermissions = localStorage.getItem('user_permissions');
    if (storedPermissions) {
      try {
        const parsed = JSON.parse(storedPermissions);
        console.log('Loaded user_permissions from localStorage:', parsed);
        setPermissions(parsed);
      } catch (e) {
        console.error('Failed to parse user_permissions:', e);
        setPermissions([]);
      }
    } else {
      // Silently default to an empty array instead of warning
      setPermissions([]);
    }
  }, []);

  const hasPermission = (code: string) => {
    if (!permissions || permissions.length === 0) return false;

    // Check if permissions match strings or backend permission objects
    const isMatched = permissions.some((p) => {
      let val = '';
      if (typeof p === 'string') {
        val = p;
      } else if (p && typeof p === 'object') {
        val = p.code || p.codename || p.name || '';
      }

      if (!val) return false;

      // Exact match or contains check
      if (val === code || val.includes(code)) return true;

      // Handle Django backend variant translations (e.g., upload_document vs add_document)
      const cleanVal = val.replace('add_', 'upload_').replace('add_', 'create_');
      const cleanCode = code.replace('add_', 'upload_').replace('create_', 'upload_');

      return cleanVal === cleanCode || cleanVal.endsWith(code) || code.endsWith(val);
    });

    return isMatched;
  };

  return { permissions, hasPermission };
}
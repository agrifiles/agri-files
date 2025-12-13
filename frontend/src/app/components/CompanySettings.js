'use client';

import { useState, useEffect, useContext } from 'react';
import { LangContext } from '../layout';
import { API_BASE, getCurrentUser, setCachedCompanyLinks } from '@/lib/utils';

// Extract CompanySlotForm outside to prevent re-creation on every render
const CompanySlotForm = ({ 
  slot, 
  form, 
  setForm, 
  companies, 
  designationOptions, 
  saving, 
  onSave, 
  onDelete 
}) => {
  const companyName = companies.find(c => c.company_id === parseInt(form.company_id))?.company_name || '';

  const handleFormChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 border-t-4 border-blue-500 hover:shadow-xl transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-gray-200">
        <h3 className="text-lg sm:text-xl font-bold text-blue-700">Company {slot}</h3>
        {form.link_id && (
          <span className="text-xs sm:text-sm px-3 py-1 bg-green-100 text-green-700 rounded-full font-semibold">
            Saved ✓
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-4">
        {/* Company Dropdown - ON TOP */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">
            Select Company *
          </label>
          <select
            value={form.company_id}
            onChange={(e) => handleFormChange('company_id', e.target.value)}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
          >
            <option value="">-- Choose a Company --</option>
            {companies.map((company) => (
              <option key={company.company_id} value={company.company_id}>
                {company.company_name}
              </option>
            ))}
          </select>
          {companyName && (
            <p className="text-xs sm:text-sm text-green-600 mt-2 font-medium">✓ {companyName}</p>
          )}
        </div>

        {/* Designation Dropdown */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">
            Designation *
          </label>
          <select
            value={form.designation}
            onChange={(e) => handleFormChange('designation', e.target.value)}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
          >
            <option value="">-- Select Designation --</option>
            {designationOptions.map((des) => (
              <option key={des} value={des}>
                {des}
              </option>
            ))}
          </select>
        </div>

        {/* Engineer Name */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">
            Engineer Name *
          </label>
          <input
            type="text"
            value={form.engineer_name || ''}
            onChange={(e) => handleFormChange('engineer_name', e.target.value)}
            placeholder="Enter name"
            className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
            autoComplete="off"
          />
        </div>

        {/* Mobile Number */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">
            Mobile Number
          </label>
          <input
            type="tel"
            value={form.mobile || ''}
            onChange={(e) => handleFormChange('mobile', e.target.value)}
            placeholder="Enter mobile"
            className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
            autoComplete="off"
          />
        </div>

        {/* Single Save Button */}
        <div className="flex gap-2 sm:gap-3 pt-2 sm:pt-4">
          <button
            onClick={() => onSave(slot, form)}
            disabled={saving === slot}
            className="flex-1 min-h-10 sm:min-h-12 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-2 sm:py-3 px-3 sm:px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-60 disabled:cursor-not-allowed transition-all text-sm sm:text-base shadow-md hover:shadow-lg"
          >
            {saving === slot ? 'Saving...' : form.link_id ? '✓ Update' : '+ Save'}
          </button>
          {form.link_id && (
            <button
              onClick={() => onDelete(slot, form)}
              disabled={saving === slot}
              className="px-3 sm:px-4 min-h-10 sm:min-h-12 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg disabled:opacity-60 disabled:cursor-not-allowed transition-all text-sm sm:text-base shadow-md hover:shadow-lg"
            >
              {saving === slot ? '...' : '🗑️'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const CompanySettings = () => {
  const { t, lang } = useContext(LangContext);
  const [companies, setCompanies] = useState([]);
  const [companyLinks, setCompanyLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null); // null or slot number (1, 2, 3)
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState(''); // 'success' or 'error'

  const designationOptions = [
    'Sales Engineer',
    'Sales Representative',
    'Technical Validator'
  ];

  // Form state for each company slot
  const [formSlot1, setFormSlot1] = useState({
    link_id: null,
    company_id: '',
    designation: '',
    engineer_name: '',
    mobile: ''
  });

  const [formSlot2, setFormSlot2] = useState({
    link_id: null,
    company_id: '',
    designation: '',
    engineer_name: '',
    mobile: ''
  });

  const [formSlot3, setFormSlot3] = useState({
    link_id: null,
    company_id: '',
    designation: '',
    engineer_name: '',
    mobile: ''
  });

  // Fetch companies and user's company links
  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = getCurrentUser();
        if (!user?.id) {
          setMsg('User not found');
          setMsgType('error');
          setLoading(false);
          return;
        }

        // Fetch master companies
        const companiesRes = await fetch(`${API_BASE}/api/company-settings/companies/list`);
        const companiesData = await companiesRes.json();

        if (companiesData.success) {
          setCompanies(companiesData.companies);
        }

        // Fetch user's company links
        const linksRes = await fetch(`${API_BASE}/api/company-settings/user/${user.id}`);
        const linksData = await linksRes.json();

        if (linksData.success) {
          setCompanyLinks(linksData.companyLinks);

          // Populate forms from existing data
          linksData.companyLinks.forEach((link) => {
            const formData = {
              link_id: link.link_id,
              company_id: link.company_id,
              designation: link.designation,
              engineer_name: link.engineer_name,
              mobile: link.mobile || ''
            };

            if (link.company_slot === 1) setFormSlot1(formData);
            else if (link.company_slot === 2) setFormSlot2(formData);
            else if (link.company_slot === 3) setFormSlot3(formData);
          });
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setMsg('Error loading company settings');
        setMsgType('error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Save company links to localStorage whenever they change
  useEffect(() => {
    if (companyLinks.length > 0) {
      setCachedCompanyLinks(companyLinks);
    }
  }, [companyLinks]);

  // ✅ PHASE 7.5: Product sync trigger when company changes
  const triggerProductSync = async (userId, oldCompanyId, newCompanyId, slot) => {
    try {
      // Step 1: Preview affected products
      const statusRes = await fetch(
        `${API_BASE}/api/company-settings/sync-status/${userId}/${oldCompanyId}`
      );
      const statusData = await statusRes.json();

      if (!statusData.success) {
        setMsg('⚠️ Could not check product migration status');
        setMsgType('warning');
        return;
      }

      const affectedCount = statusData.affectedProductsCount || 0;

      // If no products affected, skip confirmation
      if (affectedCount === 0) {
        console.log('[SYNC] No products to migrate');
        return;
      }

      // Step 2: Show confirmation dialog
      const message = `${affectedCount} product(s) linked to the old company will be migrated to the new company. Continue?`;
      const confirmed = window.confirm(message);

      if (!confirmed) {
        setMsg('Product migration cancelled');
        setMsgType('info');
        return;
      }

      // Step 3: Execute sync
      const syncRes = await fetch(`${API_BASE}/api/company-settings/sync-products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          company_slot: slot,
          old_company_id: oldCompanyId,
          new_company_id: newCompanyId
        })
      });

      const syncData = await syncRes.json();

      if (syncData.success) {
        // Step 4: Success - clear cache and show message
        const migratedCount = syncData.updatedCount || 0;
        setMsg(
          migratedCount > 0
            ? `✅ Successfully migrated ${migratedCount} product(s) to new company`
            : '✅ Company saved - no products to migrate'
        );
        setMsgType('success');

        // Clear cache so next fetch gets fresh data
        localStorage.removeItem('userCompanyLinks');
        
        console.log(
          `[SYNC-SUCCESS] Migrated ${migratedCount} products from company ${oldCompanyId} to ${newCompanyId}`
        );
      } else {
        // Step 5: Sync failed - warn user but don't fail main save
        setMsg(
          `⚠️ Company saved but product migration failed: ${syncData.error || 'Unknown error'}. Please refresh to retry.`
        );
        setMsgType('warning');
        console.error('[SYNC-FAILED]', syncData.error);
      }
    } catch (err) {
      // Non-blocking error - main save already succeeded
      console.error('[SYNC-ERROR]', err);
      setMsg('⚠️ Company saved but product sync encountered an error. Refresh page to retry.');
      setMsgType('warning');
    }
  };

  const saveCompanyLink = async (slot, form) => {
    try {
      const user = getCurrentUser();
      if (!user?.id) {
        setMsg('User not found');
        setMsgType('error');
        return;
      }

      // Validate
      if (!form.company_id || !form.designation || !form.engineer_name) {
        setMsg(`Company slot ${slot}: Please fill in all required fields`);
        setMsgType('error');
        return;
      }

      setSaving(slot);
      setMsg('');

      // Get old company_id (for sync detection)
      const existingLink = companyLinks.find(link => link.company_slot === slot);
      const oldCompanyId = existingLink?.company_id;
      const newCompanyId = form.company_id;

      const payload = {
        link_id: form.link_id,
        user_id: user.id,
        company_slot: slot,
        company_id: form.company_id,
        designation: form.designation,
        engineer_name: form.engineer_name,
        mobile: form.mobile
      };

      const res = await fetch(`${API_BASE}/api/company-settings/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.success) {
        setMsg(`Company ${slot} saved successfully!`);
        setMsgType('success');
        // Update form with returned link_id based on slot
        if (slot === 1) setFormSlot1(prev => ({ ...prev, link_id: data.data.link_id }));
        else if (slot === 2) setFormSlot2(prev => ({ ...prev, link_id: data.data.link_id }));
        else if (slot === 3) setFormSlot3(prev => ({ ...prev, link_id: data.data.link_id }));
        // Refresh company links
        const linksRes = await fetch(`${API_BASE}/api/company-settings/user/${user.id}`);
        const linksData = await linksRes.json();
        if (linksData.success) {
          setCompanyLinks(linksData.companyLinks);
        }

        // ✅ PHASE 7.5: Trigger product sync if company changed
        if (oldCompanyId && newCompanyId && oldCompanyId !== newCompanyId) {
          await triggerProductSync(user.id, oldCompanyId, newCompanyId, slot);
        }
      } else {
        setMsg(`Error: ${data.error}`);
        setMsgType('error');
      }
    } catch (err) {
      console.error('Save error:', err);
      setMsg('Error saving company link');
      setMsgType('error');
    } finally {
      setSaving(null);
    }
  };

  const deleteCompanyLink = async (slot, form) => {
    if (!form.link_id) {
      setMsg(`Company ${slot}: No link to delete`);
      setMsgType('error');
      return;
    }

    if (!window.confirm(`Delete Company ${slot}?`)) return;

    try {
      const user = getCurrentUser();
      if (!user?.id) {
        setMsg('User not found');
        setMsgType('error');
        return;
      }

      setSaving(slot);
      setMsg('');

      const res = await fetch(`${API_BASE}/api/company-settings/${form.link_id}/${user.id}`, {
        method: 'DELETE'
      });

      const data = await res.json();

      if (data.success) {
        setMsg(`Company ${slot} deleted successfully!`);
        setMsgType('success');
        // Reset form based on slot
        if (slot === 1) setFormSlot1({
          link_id: null,
          company_id: '',
          designation: '',
          engineer_name: '',
          mobile: ''
        });
        else if (slot === 2) setFormSlot2({
          link_id: null,
          company_id: '',
          designation: '',
          engineer_name: '',
          mobile: ''
        });
        else if (slot === 3) setFormSlot3({
          link_id: null,
          company_id: '',
          designation: '',
          engineer_name: '',
          mobile: ''
        });
        // Refresh company links
        const linksRes = await fetch(`${API_BASE}/api/company-settings/user/${user.id}`);
        const linksData = await linksRes.json();
        if (linksData.success) {
          setCompanyLinks(linksData.companyLinks);
        }
      } else {
        setMsg(`Error: ${data.error}`);
        setMsgType('error');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setMsg('Error deleting company link');
      setMsgType('error');
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl border-2 border-blue-200 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-black text-blue-700 mb-2">Company Settings</h2>
          <p className="text-sm sm:text-base text-gray-600">Manage your company associations (Maximum 3 companies)</p>
        </div>


        {companies.length === 0 ? (
          <div className="bg-yellow-100 text-yellow-700 p-4 rounded-lg border border-yellow-300 text-sm sm:text-base">
            No companies available. Please contact admin.
          </div>
        ) : (
          <>
          
        {/* Message Alert */}
        {msg && (
          <div
            className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg font-semibold text-sm sm:text-base ${
              msgType === 'success'
                ? 'bg-green-100 text-green-700 border border-green-300'
                : 'bg-red-100 text-red-700 border border-red-300'
            }`}
          >
            {msg}
          </div>
        )}
                      {/* Summary Section */}
            {companyLinks.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200 mb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-3">Your Companies</h3>
                <div className="flex flex-wrap gap-2">
                  {companyLinks.map((link) => (
                    <div 
                      key={link.link_id} 
                      className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2"
                    >
                      <p className="font-semibold text-gray-800 text-sm">{link.company_name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Company Forms Grid - Mobile Responsive */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <CompanySlotForm 
                slot={1} 
                form={formSlot1} 
                setForm={setFormSlot1}
                companies={companies}
                designationOptions={designationOptions}
                saving={saving}
                onSave={saveCompanyLink}
                onDelete={deleteCompanyLink}
              />
              <CompanySlotForm 
                slot={2} 
                form={formSlot2} 
                setForm={setFormSlot2}
                companies={companies}
                designationOptions={designationOptions}
                saving={saving}
                onSave={saveCompanyLink}
                onDelete={deleteCompanyLink}
              />
              <CompanySlotForm 
                slot={3} 
                form={formSlot3} 
                setForm={setFormSlot3}
                companies={companies}
                designationOptions={designationOptions}
                saving={saving}
                onSave={saveCompanyLink}
                onDelete={deleteCompanyLink}
              />
            </div>


          </>
        )}
      </div>
    </div>
  );
};

export default CompanySettings;

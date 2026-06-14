import { useRef, useState, useEffect } from 'react'
import type { ChangeEvent } from 'react'
import {
  Plus, Trash2, GripVertical, Save, ArrowLeft, Loader2, Wand2, Heading1, User,
  Mail, MapPin, Phone, CalendarDays, PenLine, ShoppingCart, Type, AlignLeft,
  ListChecks, CircleDot, CheckSquare, Hash, Image, Upload, Clock, ShieldCheck,
  ChevronsUp, Send, Table2, Star, BarChart3, Minus, PanelTopClose, FileStack,
  Globe2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { usePortalAuth } from '../context/PortalAuthContext'
import * as api from '../api'
import type { PortalUnit, PortalCircle, PortalCampus, PerfField, PerfFieldType, PerfForm, PerfScopeType } from '../types'
import { uploadImage } from '../../lib/storage'
import { validateImage, compressImage } from '../../lib/imageProcessing'
import { FormFooter } from '../../components/ui/FormFooter'

interface FieldDraft {
  key: string
  type: PerfFieldType
  label: string
  description: string
  options: string[]
  is_required: boolean
  max_value: number
}

type FieldCategory = 'Basic' | 'Survey' | 'Widgets' | 'Page'

const FIELD_TYPES: { value: PerfFieldType; label: string; desc: string; category: FieldCategory; icon: LucideIcon }[] = [
  { value: 'heading', label: 'Heading', desc: 'Large section heading', category: 'Basic', icon: Heading1 },
  { value: 'full_name', label: 'Full Name', desc: 'First and last name fields', category: 'Basic', icon: User },
  { value: 'email', label: 'Email', desc: 'Email address', category: 'Basic', icon: Mail },
  { value: 'address', label: 'Address', desc: 'Street, city, state, pin', category: 'Basic', icon: MapPin },
  { value: 'phone', label: 'Phone', desc: 'Phone number', category: 'Basic', icon: Phone },
  { value: 'date', label: 'Date Picker', desc: 'Date picker', category: 'Basic', icon: CalendarDays },
  { value: 'appointment', label: 'Appointment', desc: 'Date and time slot', category: 'Basic', icon: CalendarDays },
  { value: 'signature', label: 'Signature', desc: 'Drawn signature pad', category: 'Basic', icon: PenLine },
  { value: 'fill_blank', label: 'Fill in the Blank', desc: 'Text answer for a blank', category: 'Basic', icon: Type },
  { value: 'product_list', label: 'Product List', desc: 'Select items and quantities', category: 'Basic', icon: ShoppingCart },
  { value: 'short_text', label: 'Short Text', desc: 'Single-line answer', category: 'Basic', icon: Type },
  { value: 'long_text', label: 'Long Text', desc: 'Paragraph answer', category: 'Basic', icon: AlignLeft },
  { value: 'paragraph', label: 'Paragraph', desc: 'Read-only explanatory text', category: 'Basic', icon: AlignLeft },
  { value: 'dropdown', label: 'Dropdown', desc: 'Compact single choice', category: 'Basic', icon: ListChecks },
  { value: 'mcq', label: 'Single Choice', desc: 'Single choice from options', category: 'Basic', icon: CircleDot },
  { value: 'msq', label: 'Multiple Choice', desc: 'Multiple choices from options', category: 'Basic', icon: CheckSquare },
  { value: 'number', label: 'Number', desc: 'Numeric value', category: 'Basic', icon: Hash },
  { value: 'image', label: 'Image', desc: 'Display image from URL', category: 'Basic', icon: Image },
  { value: 'file_upload', label: 'File Upload', desc: 'Attach files by name', category: 'Basic', icon: Upload },
  { value: 'time', label: 'Time', desc: 'Time picker', category: 'Basic', icon: Clock },
  { value: 'captcha', label: 'Captcha', desc: 'Simple verification', category: 'Basic', icon: ShieldCheck },
  { value: 'spinner', label: 'Spinner', desc: 'Stepper number input', category: 'Basic', icon: ChevronsUp },
  { value: 'submit', label: 'Submit', desc: 'Submit button marker', category: 'Basic', icon: Send },
  { value: 'input_table', label: 'Input Table', desc: 'Small grid of text inputs', category: 'Survey', icon: Table2 },
  { value: 'star_rating', label: 'Star Rating', desc: '1-5 star score', category: 'Survey', icon: Star },
  { value: 'scale_rating', label: 'Scale Rating', desc: 'Numbered scale', category: 'Survey', icon: BarChart3 },
  { value: 'rating', label: 'Rating', desc: 'Score out of max value', category: 'Survey', icon: Star },
  { value: 'checkbox', label: 'Checkbox', desc: 'Yes / No tick', category: 'Widgets', icon: CheckSquare },
  { value: 'divider', label: 'Divider', desc: 'Horizontal rule', category: 'Page', icon: Minus },
  { value: 'section_collapse', label: 'Section Collapse', desc: 'Collapsible content header', category: 'Page', icon: PanelTopClose },
  { value: 'page_break', label: 'Page Break', desc: 'Visual page separator', category: 'Page', icon: FileStack },
  { value: 'section', label: 'Section', desc: 'Visual heading in the form', category: 'Page', icon: Heading1 },
  { value: 'subjective', label: 'Subjective', desc: 'Free text answer', category: 'Basic', icon: AlignLeft },
]

const CHOICE_TYPES: PerfFieldType[] = ['mcq', 'msq', 'dropdown', 'product_list', 'input_table']
const MAX_VALUE_TYPES: PerfFieldType[] = ['number', 'rating', 'star_rating', 'scale_rating', 'spinner']
const NON_ANSWER_TYPES: PerfFieldType[] = ['heading', 'paragraph', 'image', 'submit', 'divider', 'section_collapse', 'page_break', 'section']
const FIELD_LABELS = new Map(FIELD_TYPES.map(t => [t.value, t.label]))

const PRESETS: { key: string; label: string; title: string; description: string; fields: Omit<FieldDraft, 'key'>[] }[] = [
  {
    key: 'monthly_unit_report',
    label: 'Monthly Unit Report',
    title: 'Monthly Unit Report',
    description: 'Collect activity, attendance, and follow-up details from units.',
    fields: [
      { type: 'number', label: 'Programs conducted', description: '', options: [''], is_required: true, max_value: 100 },
      { type: 'number', label: 'Average attendance', description: '', options: [''], is_required: true, max_value: 500 },
      { type: 'msq', label: 'Activity types', description: '', options: ['Study circle', 'Campus meet', 'Public program', 'Relief work'], is_required: true, max_value: 10 },
      { type: 'long_text', label: 'Key highlights', description: '', options: [''], is_required: true, max_value: 10 },
      { type: 'long_text', label: 'Support needed', description: '', options: [''], is_required: false, max_value: 10 },
    ],
  },
  {
    key: 'member_feedback',
    label: 'Member Feedback',
    title: 'Member Feedback Form',
    description: 'Gather structured feedback from members after a program or campaign.',
    fields: [
      { type: 'rating', label: 'Overall experience', description: '', options: [''], is_required: true, max_value: 5 },
      { type: 'mcq', label: 'Would you attend again?', description: '', options: ['Yes', 'Maybe', 'No'], is_required: true, max_value: 10 },
      { type: 'long_text', label: 'What worked well?', description: '', options: [''], is_required: false, max_value: 10 },
      { type: 'long_text', label: 'What should improve?', description: '', options: [''], is_required: false, max_value: 10 },
    ],
  },
  {
    key: 'volunteer_signup',
    label: 'Volunteer Signup',
    title: 'Volunteer Signup',
    description: 'Collect availability and contact details for volunteer work.',
    fields: [
      { type: 'phone', label: 'Phone number', description: '', options: [''], is_required: true, max_value: 10 },
      { type: 'email', label: 'Email address', description: '', options: [''], is_required: false, max_value: 10 },
      { type: 'msq', label: 'Available days', description: '', options: ['Friday', 'Saturday', 'Sunday', 'Weekdays'], is_required: true, max_value: 10 },
      { type: 'dropdown', label: 'Preferred work area', description: '', options: ['Media', 'Ground work', 'Logistics', 'Content', 'Data'], is_required: true, max_value: 10 },
    ],
  },
]

function isTruthyFlag(value: boolean | number | undefined | null): boolean {
  return value === true || Number(value ?? 0) === 1
}

function defaultOptions(type: PerfFieldType): string[] {
  if (type === 'product_list') return ['Booklet', 'Poster', 'Registration']
  if (type === 'input_table') return ['Name', 'Role', 'Contact']
  if (type === 'dropdown' || type === 'mcq' || type === 'msq') return ['Option 1', 'Option 2']
  return ['', '']
}

function newField(type: PerfFieldType = 'short_text'): FieldDraft {
  return {
    key: crypto.randomUUID(),
    type,
    label: FIELD_LABELS.get(type) ?? '',
    description: type === 'captcha' ? 'Type SIO to verify.' : '',
    options: defaultOptions(type),
    is_required: !NON_ANSWER_TYPES.includes(type),
    max_value: type === 'star_rating' ? 5 : type === 'scale_rating' ? 10 : 10,
  }
}

function withKeys(fields: Omit<FieldDraft, 'key'>[]): FieldDraft[] {
  return fields.map(f => ({ ...f, key: crypto.randomUUID() }))
}

function fieldToDraft(field: PerfField): FieldDraft {
  return {
    key: crypto.randomUUID(),
    type: field.type,
    label: field.label,
    description: field.description ?? '',
    options: field.options && field.options.length > 0 ? field.options : defaultOptions(field.type),
    is_required: isTruthyFlag(field.is_required),
    max_value: field.max_value ?? (field.type === 'star_rating' ? 5 : field.type === 'scale_rating' ? 10 : 10),
  }
}

export function PerfFormBuilderPage() {
  const { user } = usePortalAuth()
  const portalUser = user!
  const navigate = useNavigate()
  const { formId } = useParams<{ formId?: string }>()
  const isEditMode = !!formId
  const titleRef = useRef<HTMLInputElement>(null)
  const saveErrorRef = useRef<HTMLDivElement>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [period, setPeriod] = useState('')
  const [scopeType, setScopeType] = useState<PerfScopeType>('zone')
  const [scopeRegionId, setScopeRegionId] = useState<string>('')
  const [scopeUnitId, setScopeUnitId] = useState<string>('')
  const [scopeCircleId, setScopeCircleId] = useState<string>('')
  const [scopeCampusId, setScopeCampusId] = useState<string>('')
  const [isTemplate, setIsTemplate] = useState(false)
  const [isPublic, setIsPublic] = useState(false)
  const [templateKey, setTemplateKey] = useState<string | null>(null)
  const [isActive, setIsActive] = useState(true)
  const [bannerImage, setBannerImage] = useState<string | null>(null)
  const [themePrimaryColor, setThemePrimaryColor] = useState('#ff3b3b')
  const [footerBgColor, setFooterBgColor] = useState('#6a63fe')
  const [footerTextColor, setFooterTextColor] = useState('#fdedcb')
  const [footerPatternColor, setFooterPatternColor] = useState('#6e6ef9')
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [fields, setFields] = useState<FieldDraft[]>([newField()])
  const [units, setUnits] = useState<PortalUnit[]>([])
  const [regions, setRegions] = useState<{ region_id: string; region_name: string }[]>([])
  const [circles, setCircles] = useState<PortalCircle[]>([])
  const [campuses, setCampuses] = useState<PortalCampus[]>([])
  const [savedPresets, setSavedPresets] = useState<PerfForm[]>([])
  const [saving, setSaving] = useState(false)
  const [loadingForm, setLoadingForm] = useState(isEditMode)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      api.fetchUnits(),
      api.fetchRegions(),
      api.fetchCircles(),
      api.fetchCampuses(),
    ]).then(([u, r, c, ca]) => {
      setUnits(u)
      setRegions(r.map(region => ({ region_id: region.region_id, region_name: region.region_name })))
      setCircles(c)
      setCampuses(ca)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (isEditMode) return
    let cancelled = false
    api.fetchPerfForms({ role: portalUser.role, userId: portalUser.id, unitId: portalUser.unit_id ?? undefined })
      .then(forms => {
        if (cancelled) return
        setSavedPresets(forms.filter(form => isTruthyFlag(form.is_template)))
      })
      .catch(() => {
        if (!cancelled) setSavedPresets([])
      })
    return () => { cancelled = true }
  }, [isEditMode, portalUser.id, portalUser.role, portalUser.unit_id])

  // Load existing form data when editing
  useEffect(() => {
    if (!formId) return
    let cancelled = false
    async function load() {
      try {
        const form = await api.fetchPerfForm(formId!)
        if (cancelled) return
        setTitle(form.title)
        setDescription(form.description ?? '')
        setPeriod(form.period ?? '')
        setScopeType(form.scope_type ?? (form.scope_unit_id ? 'unit' : 'zone'))
        setScopeRegionId(form.scope_region_id ?? '')
        setScopeUnitId(form.scope_unit_id ?? '')
        setScopeCircleId(form.scope_circle_id ?? '')
        setScopeCampusId(form.scope_campus_id ?? '')
        setIsTemplate(typeof form.is_template === 'boolean' ? form.is_template : Number(form.is_template) === 1)
        setIsPublic(typeof form.is_public === 'boolean' ? form.is_public : Number(form.is_public ?? 0) === 1)
        setTemplateKey(form.template_key ?? null)
        setIsActive(typeof form.is_active === 'boolean' ? form.is_active : Number(form.is_active) === 1)
        setBannerImage(form.banner_image ?? null)
        setThemePrimaryColor(form.theme_primary_color || '#ff3b3b')
        setFooterBgColor(form.footer_bg_color || '#6a63fe')
        setFooterTextColor(form.footer_text_color || '#fdedcb')
        setFooterPatternColor(form.footer_pattern_color || '#6e6ef9')
        if (form.fields && form.fields.length > 0) {
          setFields(form.fields.map(f => ({
            key: f.id || crypto.randomUUID(),
            type: f.type,
            label: f.label,
            description: f.description ?? '',
            options: f.options && f.options.length > 0 ? f.options : [''],
            is_required: typeof f.is_required === 'boolean' ? f.is_required : Number(f.is_required) === 1,
            max_value: f.max_value ?? 10,
          })))
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load form.')
      } finally {
        if (!cancelled) setLoadingForm(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [formId])

  if (!user) return null

  const pathPrefix = `/portal/${portalUser.role === 'admin' ? 'admin' : portalUser.role === 'zonal_secretary' ? 'zonal' : portalUser.role === 'regional_president' ? 'regional' : 'unit'}`

  function updateField(key: string, updates: Partial<FieldDraft>) {
    setFields(prev => prev.map(f => f.key === key ? { ...f, ...updates } : f))
  }

  function removeField(key: string) {
    setFields(prev => prev.filter(f => f.key !== key))
  }

  function addOption(fieldKey: string) {
    setFields(prev => prev.map(f => f.key === fieldKey ? { ...f, options: [...f.options, ''] } : f))
  }

  function updateOption(fieldKey: string, idx: number, value: string) {
    setFields(prev => prev.map(f => f.key === fieldKey ? { ...f, options: f.options.map((o, i) => i === idx ? value : o) } : f))
  }

  function removeOption(fieldKey: string, idx: number) {
    setFields(prev => prev.map(f => f.key === fieldKey ? { ...f, options: f.options.filter((_, i) => i !== idx) } : f))
  }

  function applyPreset(key: string) {
    const preset = PRESETS.find(p => p.key === key)
    if (!preset) return
    setTitle(preset.title)
    setDescription(preset.description)
    setTemplateKey(preset.key)
    setFields(withKeys(preset.fields))
  }

  async function applySavedPreset(form: PerfForm) {
    setTitle(form.title)
    setDescription(form.description ?? '')
    setTemplateKey(form.template_key ?? form.id)
    setBannerImage(form.banner_image ?? null)
    setThemePrimaryColor(form.theme_primary_color || '#ff3b3b')
    setFooterBgColor(form.footer_bg_color || '#6a63fe')
    setFooterTextColor(form.footer_text_color || '#fdedcb')
    setFooterPatternColor(form.footer_pattern_color || '#6e6ef9')

    try {
      const fullForm = await api.fetchPerfForm(form.id)
      if (fullForm.fields && fullForm.fields.length > 0) {
        setFields(fullForm.fields.map(fieldToDraft))
      }
    } catch {
      if (!form.field_count) return
      showSaveError('Could not load the saved preset fields. Try opening the preset form and saving it again.')
    }
  }

  function addField(type: PerfFieldType) {
    setFields(prev => [...prev, newField(type)])
  }

  function changeFieldType(key: string, type: PerfFieldType) {
    const draft = newField(type)
    updateField(key, {
      type,
      label: draft.label,
      description: draft.description,
      options: draft.options,
      is_required: draft.is_required,
      max_value: draft.max_value,
    })
  }

  async function handleBannerSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    try {
      validateImage(file)
      setUploadingBanner(true)
      const compressed = await compressImage(file)
      const url = await uploadImage(compressed, undefined, formId)
      setBannerImage(url)
    } catch (err) {
      showSaveError(err instanceof Error ? err.message : 'Banner upload failed.')
    } finally {
      setUploadingBanner(false)
    }
  }

  function buildFieldsPayload() {
    return fields.map(f => ({
      type: f.type,
      label: f.label.trim(),
      description: f.description.trim() || undefined,
      options: CHOICE_TYPES.includes(f.type) ? f.options.filter(o => o.trim()) : undefined,
      is_required: f.is_required,
      max_value: MAX_VALUE_TYPES.includes(f.type) ? f.max_value : undefined,
    }))
  }

  function showSaveError(message: string, focusTarget?: HTMLElement | null) {
    setError(message)
    window.requestAnimationFrame(() => {
      const target = focusTarget ?? saveErrorRef.current
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      focusTarget?.focus()
    })
  }

  async function handleSave() {
    setError(null)
    if (!title.trim()) { showSaveError('Title is required before the form can be created.', titleRef.current); return }
    if (scopeType === 'region' && !scopeRegionId) { showSaveError('Select a region for this form.'); return }
    if (scopeType === 'unit' && !scopeUnitId) { showSaveError('Select a unit for this form.'); return }
    if (scopeType === 'circle' && !scopeCircleId) { showSaveError('Select a circle for this form.'); return }
    if (scopeType === 'campus' && !scopeCampusId) { showSaveError('Select a campus for this form.'); return }
    if (fields.length === 0) { showSaveError('Add at least one field.'); return }
    for (const f of fields) {
      if (!f.label.trim()) { showSaveError('All fields must have a label.'); return }
      if (CHOICE_TYPES.includes(f.type) && f.options.filter(o => o.trim()).length < 1) {
        showSaveError(`"${f.label}" needs at least one option or column.`); return
      }
    }

    setSaving(true)
    try {
      if (isEditMode) {
        await api.updatePerfForm(formId!, {
          title: title.trim(),
          description: description.trim() || null,
          scope_type: scopeType,
          scope_region_id: scopeType === 'region' ? scopeRegionId || null : null,
          scope_unit_id: scopeType === 'unit' ? scopeUnitId || null : null,
          scope_circle_id: scopeType === 'circle' ? scopeCircleId || null : null,
          scope_campus_id: scopeType === 'campus' ? scopeCampusId || null : null,
          period: period.trim() || null,
          is_active: isActive,
          is_template: isTemplate,
          is_public: isPublic,
          template_key: templateKey,
          banner_image: bannerImage,
          theme_primary_color: themePrimaryColor,
          footer_bg_color: footerBgColor,
          footer_text_color: footerTextColor,
          footer_pattern_color: footerPatternColor,
          fields: buildFieldsPayload(),
        })
      } else {
        await api.createPerfForm({
          title: title.trim(),
          description: description.trim() || undefined,
          created_by: user!.id,
          scope_type: scopeType,
          scope_region_id: scopeType === 'region' ? scopeRegionId || null : null,
          scope_unit_id: scopeType === 'unit' ? scopeUnitId || null : null,
          scope_circle_id: scopeType === 'circle' ? scopeCircleId || null : null,
          scope_campus_id: scopeType === 'campus' ? scopeCampusId || null : null,
          period: period.trim() || undefined,
          is_template: isTemplate,
          is_public: isPublic,
          template_key: templateKey,
          banner_image: bannerImage,
          theme_primary_color: themePrimaryColor,
          footer_bg_color: footerBgColor,
          footer_text_color: footerTextColor,
          footer_pattern_color: footerPatternColor,
          fields: buildFieldsPayload(),
        })
      }
      navigate(`${pathPrefix}/forms`)
    } catch (err) { showSaveError(err instanceof Error ? err.message : 'Failed to save.') }
    finally { setSaving(false) }
  }

  if (loadingForm) {
    return (
      <div className="portal-page portal-page-narrow">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center', padding: 40 }}>
          <Loader2 size={20} className="portal-spin" /> <span style={{ color: 'var(--p-text-secondary)' }}>Loading form…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="portal-page portal-page-narrow">
      <div>
        <button type="button" onClick={() => navigate(`${pathPrefix}/forms`)} className="portal-btn portal-btn-ghost portal-btn-sm portal-self-start" style={{ marginBottom: 8 }}>
          <ArrowLeft size={14} /> Back to Forms
        </button>
        <h1 className="portal-heading">{isEditMode ? 'Edit Form' : 'Create Form'}</h1>
        <p className="portal-subheading">
          {isEditMode ? 'Update the form metadata and fields.' : 'Design a form with custom fields for members to fill.'}
        </p>
      </div>

      {error && <div className="portal-alert portal-alert-error">{error}</div>}

      {/* Form metadata */}
      <div className="portal-card portal-card-body">
        <div className="portal-form-stack">
          {!isEditMode && (
            <div>
              <label className="portal-label">Preset</label>
              <div className="portal-perf-preset-row">
                {PRESETS.map(preset => (
                  <button key={preset.key} type="button" onClick={() => applyPreset(preset.key)} className="portal-btn portal-btn-secondary portal-btn-sm">
                    <Wand2 size={14} /> {preset.label}
                  </button>
                ))}
                {savedPresets.map(preset => (
                  <button key={preset.id} type="button" onClick={() => applySavedPreset(preset)} className="portal-btn portal-btn-secondary portal-btn-sm">
                    <Wand2 size={14} /> {preset.title}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <label className="portal-label portal-label-required">Title</label>
            <input ref={titleRef} type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. January 2026 Evaluation" className="portal-input" />
          </div>
          <div>
            <label className="portal-label">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional description for members" rows={2} className="portal-input portal-textarea" />
          </div>
          <div className="portal-form-row">
            <div className="flex-1">
              <label className="portal-label">Period</label>
              <input type="text" value={period} onChange={e => setPeriod(e.target.value)} placeholder="e.g. 2026-01, Q1-2026" className="portal-input" />
            </div>
            <div className="flex-1">
              <label className="portal-label">Hierarchy</label>
              <select value={scopeType} onChange={e => setScopeType(e.target.value as PerfScopeType)} className="portal-input portal-select">
                <option value="zone">Zone-wide</option>
                <option value="region">Region</option>
                <option value="unit">Unit</option>
                <option value="circle">Circle</option>
                <option value="campus">Campus</option>
              </select>
            </div>
          </div>
          {scopeType !== 'zone' && (
            <div>
              <label className="portal-label">Scope Target</label>
              {scopeType === 'region' && (
                <select value={scopeRegionId} onChange={e => setScopeRegionId(e.target.value)} className="portal-input portal-select">
                  <option value="">Select region</option>
                  {regions.map(r => <option key={r.region_id} value={r.region_id}>{r.region_name}</option>)}
                </select>
              )}
              {scopeType === 'unit' && (
                <select value={scopeUnitId} onChange={e => setScopeUnitId(e.target.value)} className="portal-input portal-select">
                  <option value="">Select unit</option>
                  {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              )}
              {scopeType === 'circle' && (
                <select value={scopeCircleId} onChange={e => setScopeCircleId(e.target.value)} className="portal-input portal-select">
                  <option value="">Select circle</option>
                  {circles.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              )}
              {scopeType === 'campus' && (
                <select value={scopeCampusId} onChange={e => setScopeCampusId(e.target.value)} className="portal-input portal-select">
                  <option value="">Select campus</option>
                  {campuses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              )}
            </div>
          )}
          <label className="portal-perf-required-toggle">
            <input type="checkbox" checked={isTemplate} onChange={e => setIsTemplate(e.target.checked)} />
            <span>Save as reusable preset for this hierarchy</span>
          </label>
          <label className="portal-perf-required-toggle">
            <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} />
            <span><Globe2 size={14} /> Public link (people outside the portal can submit)</span>
          </label>
          {isEditMode && (
            <label className="portal-perf-required-toggle">
              <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
              <span>Active (members can fill this form)</span>
            </label>
          )}

          <div className="portal-perf-appearance-panel">
            <div className="portal-perf-appearance-header">
              <div>
                <h2>Appearance</h2>
                <p>Customize the banner, accent, and footer shown on the fill page.</p>
              </div>
            </div>

            <div className="portal-perf-banner-editor">
              <div className="portal-perf-banner-preview">
                {bannerImage ? (
                  <img src={bannerImage} alt="Form banner preview" />
                ) : (
                  <FormFooter
                    bgColor={footerBgColor}
                    textColor={footerTextColor}
                    patternColor={footerPatternColor}
                  />
                )}
              </div>
              <div className="portal-perf-banner-actions">
                <label className="portal-btn portal-btn-secondary portal-btn-sm">
                  {uploadingBanner ? <Loader2 size={14} className="portal-spin" /> : <Upload size={14} />}
                  {bannerImage ? 'Change Banner' : 'Upload Banner'}
                  <input type="file" accept="image/*" onChange={handleBannerSelect} disabled={uploadingBanner} className="portal-hidden-input" />
                </label>
                {bannerImage && (
                  <button type="button" onClick={() => setBannerImage(null)} className="portal-btn portal-btn-ghost portal-btn-sm portal-text-red">
                    <Trash2 size={14} /> Remove
                  </button>
                )}
              </div>
            </div>

            <div className="portal-perf-color-grid">
              <ColorControl label="Accent" value={themePrimaryColor} onChange={setThemePrimaryColor} swatches={['#ff3b3b', '#2563eb', '#16a34a', '#ca8a04', '#7c3aed', '#0891b2']} />
              <ColorControl label="Footer BG" value={footerBgColor} onChange={setFooterBgColor} swatches={['#6a63fe', '#ff3b3b', '#111827', '#0f766e', '#7c2d12', '#4338ca']} />
              <ColorControl label="Footer Text" value={footerTextColor} onChange={setFooterTextColor} swatches={['#fdedcb', '#ffffff', '#111827', '#fef3c7', '#dcfce7', '#e0f2fe']} />
              <ColorControl label="Pattern" value={footerPatternColor} onChange={setFooterPatternColor} swatches={['#6e6ef9', '#ff7676', '#334155', '#14b8a6', '#f59e0b', '#8b5cf6']} />
            </div>

            <div className="portal-perf-appearance-live">
              <div className="portal-perf-appearance-live-card" style={{ borderTopColor: themePrimaryColor }}>
                <span>Sample question</span>
                <div />
              </div>
              <FormFooter
                bgColor={footerBgColor}
                textColor={footerTextColor}
                patternColor={footerPatternColor}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Fields */}
      <div className="portal-form-stack">
        <h2 className="portal-heading" style={{ fontSize: '1.125rem' }}>Fields</h2>

        <div className="portal-card portal-card-body-sm">
          <div className="portal-form-elements">
            {(['Basic', 'Survey', 'Widgets', 'Page'] as FieldCategory[]).map(category => (
              <div key={category} className="portal-form-elements-group">
                <div className="portal-form-elements-title">{category} Elements</div>
                <div className="portal-form-elements-grid">
                  {FIELD_TYPES.filter(t => t.category === category).map(fieldType => {
                    const Icon = fieldType.icon
                    return (
                      <button key={fieldType.value} type="button" onClick={() => addField(fieldType.value)} className="portal-form-element-btn" title={fieldType.desc}>
                        <Icon size={15} />
                        <span>{fieldType.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {fields.map((field, idx) => (
          <div key={field.key} className="portal-card portal-card-body-sm">
            <div className="portal-perf-field-header">
              <div className="portal-perf-field-grip"><GripVertical size={16} /></div>
              <span className="portal-perf-field-num">#{idx + 1}</span>
              <select value={field.type} onChange={e => changeFieldType(field.key, e.target.value as PerfFieldType)} className="portal-input portal-select portal-perf-field-type">
                {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label} — {t.desc}</option>)}
              </select>
              <button type="button" onClick={() => removeField(field.key)} className="portal-btn portal-btn-ghost portal-btn-sm portal-text-red" aria-label="Remove field"><Trash2 size={14} /></button>
            </div>

            <div className="portal-form-stack" style={{ marginTop: 12 }}>
              <div>
                <label className="portal-label portal-label-required">Label</label>
                <input type="text" value={field.label} onChange={e => updateField(field.key, { label: e.target.value })} placeholder="e.g. How many events did you attend?" className="portal-input" />
              </div>
              <div>
                <label className="portal-label">Help Text</label>
                <input type="text" value={field.description} onChange={e => updateField(field.key, { description: e.target.value })} placeholder="Optional explanation" className="portal-input" />
              </div>

              {/* Options for choice, product, and table fields */}
              {CHOICE_TYPES.includes(field.type) && (
                <div>
                  <label className="portal-label">{field.type === 'input_table' ? 'Columns' : field.type === 'product_list' ? 'Products' : 'Options'}</label>
                  <div className="portal-form-stack">
                    {field.options.map((opt, oi) => (
                      <div key={oi} className="portal-perf-option-row">
                        <input type="text" value={opt} onChange={e => updateOption(field.key, oi, e.target.value)} placeholder={`Option ${oi + 1}`} className="portal-input flex-1" />
                        {field.options.length > 1 && (
                          <button type="button" onClick={() => removeOption(field.key, oi)} className="portal-btn portal-btn-ghost portal-btn-sm portal-text-red"><Trash2 size={12} /></button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={() => addOption(field.key)} className="portal-btn portal-btn-ghost portal-btn-sm portal-self-start"><Plus size={14} /> Add Option</button>
                  </div>
                </div>
              )}

              {/* Max value for number/rating */}
              {MAX_VALUE_TYPES.includes(field.type) && (
                <div>
                  <label className="portal-label">{field.type === 'spinner' ? 'Maximum' : 'Max Value'}</label>
                  <input type="number" value={field.max_value} onChange={e => updateField(field.key, { max_value: parseInt(e.target.value) || 0 })} className="portal-input" style={{ maxWidth: 120 }} />
                </div>
              )}

              {!NON_ANSWER_TYPES.includes(field.type) && (
                <label className="portal-perf-required-toggle">
                  <input type="checkbox" checked={field.is_required} onChange={e => updateField(field.key, { is_required: e.target.checked })} />
                  <span>Required</span>
                </label>
              )}
            </div>
          </div>
        ))}

        <button type="button" onClick={() => setFields(prev => [...prev, newField()])} className="portal-btn portal-btn-secondary portal-self-start">
          <Plus size={16} /> Add Field
        </button>
      </div>

      {/* Save */}
      <div className="portal-save-footer">
        {error && (
          <div ref={saveErrorRef} className="portal-alert portal-alert-error" aria-live="polite">
            {error}
          </div>
        )}
        <button type="button" onClick={handleSave} disabled={saving} className="portal-btn portal-btn-primary portal-self-start">
          <Save size={16} /> {saving ? 'Saving…' : isEditMode ? 'Save Changes' : 'Create Form'}
        </button>
      </div>
    </div>
  )
}

function ColorControl({
  label,
  value,
  onChange,
  swatches,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  swatches: string[]
}) {
  return (
    <div className="portal-perf-color-control">
      <label className="portal-label">{label}</label>
      <div className="portal-perf-color-swatches">
        {swatches.map(color => (
          <button
            key={color}
            type="button"
            className="portal-perf-color-swatch"
            style={{ background: color, boxShadow: value === color ? `0 0 0 2px var(--p-bg-card), 0 0 0 4px ${color}` : undefined }}
            onClick={() => onChange(color)}
            aria-label={`${label} ${color}`}
          />
        ))}
      </div>
      <div className="portal-perf-color-input-row">
        <input type="color" value={value} onChange={e => onChange(e.target.value)} aria-label={`${label} color picker`} />
        <input type="text" value={value} onChange={e => onChange(e.target.value)} className="portal-input" />
      </div>
    </div>
  )
}

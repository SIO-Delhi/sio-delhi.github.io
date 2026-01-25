import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../lib/api'
import type { FormDTO, FormFieldDTO } from '../lib/api'
import { Loader2, CheckCircle, AlertCircle, Star, Upload } from 'lucide-react'
import { uploadPdf, uploadImage } from '../lib/storage'
import sioLogo from '../assets/siodel_logo.png'

export function PublicForm() {
    const { formId } = useParams()

    const [form, setForm] = useState<FormDTO | null>(null)
    const [values, setValues] = useState<Record<string, unknown>>({})
    const [responseId] = useState(() => crypto.randomUUID()) // Generate fixed ID for this session
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [submitMessage, setSubmitMessage] = useState('')
    const [loadError, setLoadError] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [currentPageIndex, setCurrentPageIndex] = useState(0)
    const [isNavigating, setIsNavigating] = useState(false)

    // Helper to get ordered pages
    const pages = form?.pages?.sort((a, b) => a.displayOrder - b.displayOrder) || []
    const currentPage = pages[currentPageIndex]

    // If no pages defined (legacy), use all fields
    const visibleFields = currentPage
        ? (form?.fields?.filter(f => f.pageId === currentPage.id) || [])
        : (form?.fields || [])

    // Sort fields by displayOrder
    visibleFields.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))

    useEffect(() => {
        if (formId) {
            loadForm()
        }
    }, [formId])

    const loadForm = async () => {
        setLoading(true)
        const result = await api.forms.getPublic(formId!)
        if (result.error) {
            setLoadError(result.error)
        } else if (result.data) {
            setForm(result.data)
            // Initialize default values
            const defaults: Record<string, unknown> = {}
            result.data.fields?.forEach(field => {
                if (field.type === 'checkbox') {
                    defaults[field.id] = []
                } else {
                    defaults[field.id] = ''
                }
            })
            setValues(defaults)
        }
        setLoading(false)
    }

    const handleChange = (fieldId: string, value: unknown) => {
        setValues(prev => ({ ...prev, [fieldId]: value }))
        // Clear error when user starts typing
        if (errors[fieldId]) {
            setErrors(prev => {
                const newErrors = { ...prev }
                delete newErrors[fieldId]
                return newErrors
            })
        }
    }

    const [uploadingFields, setUploadingFields] = useState<Record<string, boolean>>({})

    const handleFileUpload = async (fieldId: string, file: File) => {
        const targetFormId = formId || form?.id
        console.log('PublicForm handleFileUpload - Target formId:', targetFormId) // DEBUG
        setUploadingFields(prev => ({ ...prev, [fieldId]: true }))
        try {
            let url = ''
            if (file.type.startsWith('image/')) {
                // Pass responseId as the "userName" param (for folder structure)
                url = await uploadImage(file, undefined, targetFormId, responseId)
            } else {
                url = await uploadPdf(file, targetFormId, responseId)
            }
            handleChange(fieldId, url)
        } catch (err) {
            console.error(err)
            alert('File upload failed')
        } finally {
            setUploadingFields(prev => {
                const newState = { ...prev }
                delete newState[fieldId]
                return newState
            })
        }
    }

    const handleCheckboxChange = (fieldId: string, option: string, checked: boolean) => {
        const currentValues = (values[fieldId] as string[]) || []
        if (checked) {
            handleChange(fieldId, [...currentValues, option])
        } else {
            handleChange(fieldId, currentValues.filter(v => v !== option))
        }
    }

    const validateCurrentPage = () => {
        const newErrors: Record<string, string> = {}
        visibleFields.forEach(field => {
            if (field.isRequired) {
                const value = values[field.id]
                const isEmpty =
                    value === undefined ||
                    value === null ||
                    value === '' ||
                    (Array.isArray(value) && value.length === 0)
                if (isEmpty) {
                    newErrors[field.id] = 'This field is required'
                }
            }
        })

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            const firstErrorField = document.querySelector('[data-error="true"]')
            firstErrorField?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            return false
        }
        return true
    }

    const handleNext = () => {
        if (isNavigating) return
        console.log('handleNext called. Current Page:', currentPageIndex, 'Total Pages:', pages.length)
        if (validateCurrentPage()) {
            console.log('Validation passed. Advancing page.')
            setIsNavigating(true)
            setCurrentPageIndex(prev => prev + 1)
            window.scrollTo({ top: 0, behavior: 'smooth' })
            setTimeout(() => setIsNavigating(false), 500)
        } else {
            console.log('Validation failed.')
        }
    }

    const handleBack = () => {
        if (isNavigating) return
        setIsNavigating(true)
        setCurrentPageIndex(prev => prev - 1)
        window.scrollTo({ top: 0, behavior: 'smooth' })
        setTimeout(() => setIsNavigating(false), 500)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (isNavigating.current) return // Block double submits during transition
        console.log('handleSubmit called. Current Page:', currentPageIndex, 'isLastPage:', currentPageIndex === pages.length - 1)

        // If not on the last page, treat Enter/Submit as "Next"
        if (currentPageIndex < pages.length - 1) {
            console.log('Not last page. Redirecting to handleNext.')
            handleNext()
            return
        }

        if (!validateCurrentPage()) return

        console.log('Submitting form...')
        setIsSubmitting(true)
        // Pass the pre-generated responseId so backend links it correctly
        const result = await api.forms.submit(formId!, { ...values, _responseId: responseId })

        if (result.error) {
            if ((result as any).data?.fieldErrors) {
                setErrors((result as any).data.fieldErrors)
            } else {
                alert(result.error)
            }
        } else if (result.data) {
            setSubmitted(true)
            setSubmitMessage(result.data.message)
        }
        setIsSubmitting(false)
    }

    // Theme colors with defaults
    const primaryColor = form?.themePrimaryColor || '#ff3b3b'
    const backgroundColor = form?.themeBackground || '#fafafa'

    const renderField = (field: FormFieldDTO) => {
        const hasError = !!errors[field.id]
        const baseInputStyle: React.CSSProperties = {
            width: '100%',
            padding: '14px 16px',
            borderRadius: '10px',
            background: 'white',
            border: hasError ? '2px solid #ef4444' : '1px solid #e5e5e5',
            color: '#1a1a1a',
            fontSize: '1rem',
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.2s'
        }

        switch (field.type) {
            case 'text':
            case 'email':
            case 'phone':
                return (
                    <input
                        type={field.type === 'phone' ? 'tel' : field.type}
                        value={(values[field.id] as string) || ''}
                        onChange={e => handleChange(field.id, e.target.value)}
                        placeholder={field.placeholder || ''}
                        style={baseInputStyle}
                    />
                )

            case 'textarea':
                return (
                    <textarea
                        value={(values[field.id] as string) || ''}
                        onChange={e => handleChange(field.id, e.target.value)}
                        placeholder={field.placeholder || ''}
                        style={{ ...baseInputStyle, minHeight: '120px', resize: 'vertical', fontFamily: 'inherit' }}
                    />
                )

            case 'number':
                return (
                    <input
                        type="number"
                        value={(values[field.id] as string) || ''}
                        onChange={e => handleChange(field.id, e.target.value)}
                        placeholder={field.placeholder || ''}
                        style={baseInputStyle}
                    />
                )

            case 'date':
                return (
                    <input
                        type="date"
                        value={(values[field.id] as string) || ''}
                        onChange={e => handleChange(field.id, e.target.value)}
                        style={baseInputStyle}
                    />
                )

            case 'dropdown':
                return (
                    <select
                        value={(values[field.id] as string) || ''}
                        onChange={e => handleChange(field.id, e.target.value)}
                        style={{ ...baseInputStyle, cursor: 'pointer' }}
                    >
                        <option value="">{field.placeholder || 'Select an option'}</option>
                        {field.options?.map((opt, idx) => (
                            <option key={idx} value={opt}>{opt}</option>
                        ))}
                    </select>
                )

            case 'radio':
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {field.options?.map((opt, idx) => (
                            <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                                <input
                                    type="radio"
                                    name={field.id}
                                    value={opt}
                                    checked={values[field.id] === opt}
                                    onChange={() => handleChange(field.id, opt)}
                                    style={{ width: '20px', height: '20px', accentColor: primaryColor }}
                                />
                                <span style={{ color: '#374151', fontSize: '1rem' }}>{opt}</span>
                            </label>
                        ))}
                    </div>
                )

            case 'checkbox':
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {field.options?.map((opt, idx) => (
                            <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={((values[field.id] as string[]) || []).includes(opt)}
                                    onChange={e => handleCheckboxChange(field.id, opt, e.target.checked)}
                                    style={{ width: '20px', height: '20px', accentColor: primaryColor }}
                                />
                                <span style={{ color: '#374151', fontSize: '1rem' }}>{opt}</span>
                            </label>
                        ))}
                    </div>
                )

            case 'rating':
                const ratingValue = (values[field.id] as number) || 0
                return (
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {[1, 2, 3, 4, 5].map(star => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => handleChange(field.id, star)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    color: star <= ratingValue ? '#fbbf24' : '#d1d5db',
                                    transition: 'transform 0.1s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <Star size={32} fill={star <= ratingValue ? '#fbbf24' : 'transparent'} />
                            </button>
                        ))}
                    </div>
                )

            case 'file':
                const isUploading = uploadingFields[field.id]
                const fileValue = values[field.id] as string

                return (
                    <div style={{ position: 'relative' }}>
                        {!fileValue ? (
                            <div style={{
                                ...baseInputStyle,
                                padding: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                cursor: isUploading ? 'wait' : 'pointer',
                                position: 'relative'
                            }}>
                                {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                                <span style={{ color: '#6b7280' }}>
                                    {isUploading ? 'Uploading...' : 'Click to upload file'}
                                </span>
                                <input
                                    type="file"
                                    onChange={e => {
                                        const file = e.target.files?.[0]
                                        if (file) handleFileUpload(field.id, file)
                                    }}
                                    disabled={isUploading}
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        opacity: 0,
                                        cursor: 'pointer'
                                    }}
                                />
                            </div>
                        ) : (
                            <div style={{
                                ...baseInputStyle,
                                padding: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: '#f0fdf4',
                                borderColor: '#22c55e'
                            }}>
                                <span style={{ color: '#15803d', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    File Uploaded
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handleChange(field.id, '')}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#ef4444',
                                        fontSize: '0.85rem',
                                        cursor: 'pointer',
                                        fontWeight: 500
                                    }}
                                >
                                    Remove
                                </button>
                            </div>
                        )}
                    </div>
                )

            default:
                return (
                    <input
                        type="text"
                        value={(values[field.id] as string) || ''}
                        onChange={e => handleChange(field.id, e.target.value)}
                        placeholder={field.placeholder || ''}
                        style={baseInputStyle}
                    />
                )
        }
    }

    if (loading) {
        return (
            <div style={{
                position: 'fixed',
                inset: 0,
                background: backgroundColor,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '24px',
                zIndex: 9999
            }}>
                <div style={{ animation: 'float 3s ease-in-out infinite' }}>
                    <img
                        src={sioLogo}
                        alt="SIO Delhi"
                        style={{ height: '80px', width: 'auto' }}
                    />
                </div>

                {/* Newton's Cradle Loader */}
                <div className="newtons-cradle">
                    <div className="newtons-cradle__dot"></div>
                    <div className="newtons-cradle__dot"></div>
                    <div className="newtons-cradle__dot"></div>
                    <div className="newtons-cradle__dot"></div>
                </div>

                <style>{`
                    @keyframes float {
                        0%, 100% { transform: translateY(0); }
                        50% { transform: translateY(-10px); }
                    }

                    .newtons-cradle {
                        position: relative;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        width: 70px;
                        height: 70px;
                    }

                    .newtons-cradle__dot {
                        position: relative;
                        display: flex;
                        align-items: center;
                        height: 100%;
                        width: 25%;
                        transform-origin: center top;
                    }

                    .newtons-cradle__dot::after {
                        content: '';
                        display: block;
                        width: 100%;
                        height: 25%;
                        border-radius: 50%;
                        background-color: ${primaryColor};
                    }

                    .newtons-cradle__dot:first-child {
                        animation: swing 1.2s linear infinite;
                    }

                    .newtons-cradle__dot:last-child {
                        animation: swing2 1.2s linear infinite;
                    }

                    @keyframes swing {
                        0% { transform: rotate(0deg); animation-timing-function: ease-out; }
                        25% { transform: rotate(70deg); animation-timing-function: ease-in; }
                        50% { transform: rotate(0deg); animation-timing-function: linear; }
                    }

                    @keyframes swing2 {
                        0% { transform: rotate(0deg); animation-timing-function: linear; }
                        50% { transform: rotate(0deg); animation-timing-function: ease-out; }
                        75% { transform: rotate(-70deg); animation-timing-function: ease-in; }
                        100% { transform: rotate(0deg); animation-timing-function: linear; }
                    }
                `}</style>
            </div>
        )
    }

    if (loadError) {
        return (
            <div style={{
                minHeight: '100vh',
                background: backgroundColor,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px'
            }}>
                <div style={{
                    background: 'white',
                    borderRadius: '20px',
                    padding: '48px',
                    maxWidth: '500px',
                    textAlign: 'center',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                    <div style={{
                        width: '64px', height: '64px', borderRadius: '50%',
                        background: '#fef2f2',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 24px'
                    }}>
                        <AlertCircle size={32} style={{ color: '#ef4444' }} />
                    </div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1a1a1a', margin: '0 0 12px' }}>
                        Form Unavailable
                    </h1>
                    <p style={{ color: '#6b7280', margin: 0, lineHeight: 1.6 }}>
                        {loadError}
                    </p>
                </div>
            </div>
        )
    }

    if (submitted) {
        return (
            <div style={{
                minHeight: '100vh',
                background: backgroundColor,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px'
            }}>
                <div style={{
                    background: 'white',
                    borderRadius: '20px',
                    padding: '48px',
                    maxWidth: '500px',
                    textAlign: 'center',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                    <div style={{
                        width: '64px', height: '64px', borderRadius: '50%',
                        background: '#f0fdf4',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 24px'
                    }}>
                        <CheckCircle size={32} style={{ color: '#22c55e' }} />
                    </div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1a1a1a', margin: '0 0 12px' }}>
                        Response Submitted
                    </h1>
                    <p style={{ color: '#6b7280', margin: 0, lineHeight: 1.6 }}>
                        {submitMessage}
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: backgroundColor,
            padding: '40px 24px'
        }}>
            <form
                onSubmit={handleSubmit}
                style={{
                    maxWidth: '700px',
                    margin: '0 auto'
                }}
            >
                {/* Banner Image */}
                {form?.bannerImage && (
                    <div style={{
                        width: '100%',
                        aspectRatio: '3/1',
                        borderRadius: '20px 20px 0 0',
                        overflow: 'hidden',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}>
                        <img
                            src={form.bannerImage}
                            alt=""
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                            }}
                        />
                    </div>
                )}

                {/* Form Header */}
                <div style={{
                    background: 'white',
                    borderRadius: form?.bannerImage ? '0' : '20px 20px 0 0',
                    padding: '32px',
                    borderTop: form?.bannerImage ? 'none' : `6px solid ${primaryColor}`,
                    boxShadow: form?.bannerImage ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                    <h1
                        style={{ fontSize: '2rem', fontWeight: 700, color: '#1a1a1a', margin: '0 0 8px' }}
                        className="prose prose-lg max-w-none prose-headings:m-0 prose-p:m-0"
                        dangerouslySetInnerHTML={{ __html: form?.title || '' }}
                    />
                    {form?.description && (
                        <div
                            style={{ color: '#6b7280', margin: 0, lineHeight: 1.6 }}
                            className="prose prose-sm max-w-none prose-p:my-2 prose-headings:my-3 prose-ul:my-2"
                            dangerouslySetInnerHTML={{ __html: form.description }}
                        />
                    )}
                </div>

                {/* Pages Indicator */}
                {pages.length > 1 && (
                    <div style={{ marginBottom: '24px', padding: '0 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: primaryColor }}>
                                Page {currentPageIndex + 1}
                            </span>
                            <span style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                                of {pages.length}
                            </span>
                        </div>
                        <div style={{ width: '100%', height: '4px', background: '#e5e5e5', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{
                                width: `${((currentPageIndex + 1) / pages.length) * 100}%`,
                                height: '100%',
                                background: primaryColor,
                                transition: 'width 0.3s ease'
                            }} />
                        </div>
                        {currentPage && (
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1a1a1a', marginTop: '16px' }}>
                                {currentPage.title}
                            </h2>
                        )}
                    </div>
                )}

                {/* Fields */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                    {visibleFields.map((field, idx) => (
                        <div
                            key={field.id}
                            data-error={!!errors[field.id]}
                            style={{
                                background: 'white',
                                padding: '16px 24px',
                                borderTop: '1px solid #f3f4f6',
                                boxShadow: idx === visibleFields.length - 1 ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none',
                                borderRadius: idx === visibleFields.length - 1 ? '0 0 20px 20px' : '0'
                            }}
                        >
                            <label style={{ display: 'block', marginBottom: '12px' }}>
                                <span style={{ fontWeight: 600, color: '#374151', fontSize: '1rem' }}>
                                    {field.label}
                                    {field.isRequired && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
                                </span>
                                {field.helpText && (
                                    <span style={{ display: 'block', fontSize: '0.875rem', color: '#9ca3af', marginTop: '4px' }}>
                                        {field.helpText}
                                    </span>
                                )}
                            </label>
                            {renderField(field)}
                            {errors[field.id] && (
                                <p style={{ color: '#ef4444', fontSize: '0.875rem', margin: '8px 0 0' }}>
                                    {errors[field.id]}
                                </p>
                            )}
                        </div>
                    ))}
                </div>

                {/* Navigation / Submit Buttons */}
                <div style={{ marginTop: '24px', display: 'flex', gap: '16px', justifyContent: 'space-between' }}>
                    {currentPageIndex > 0 && (
                        <button
                            key="btn-back"
                            type="button"
                            onClick={handleBack}
                            style={{
                                background: 'white',
                                color: '#374151',
                                border: '1px solid #d1d5db',
                                padding: '16px 32px',
                                borderRadius: '10px',
                                fontSize: '1rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            Back
                        </button>
                    )}

                    {currentPageIndex < pages.length - 1 ? (
                        <button
                            key="btn-next"
                            type="button"
                            onClick={handleNext}
                            style={{
                                background: primaryColor,
                                color: 'white',
                                border: 'none',
                                padding: '16px 32px',
                                borderRadius: '10px',
                                fontSize: '1rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                marginLeft: 'auto', // Push to right
                                display: 'flex', alignItems: 'center', gap: '8px'
                            }}
                        >
                            Next
                        </button>
                    ) : (
                        <button
                            key="btn-submit"
                            type="submit"
                            disabled={isSubmitting}
                            style={{
                                background: primaryColor,
                                color: 'white',
                                border: 'none',
                                padding: '16px 32px',
                                borderRadius: '10px',
                                fontSize: '1rem',
                                fontWeight: 600,
                                cursor: isSubmitting ? 'wait' : 'pointer',
                                opacity: isSubmitting ? 0.7 : 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginLeft: 'auto',
                                boxShadow: `0 2px 4px ${primaryColor}4D`
                            }}
                        >
                            {isSubmitting && <Loader2 size={18} className="animate-spin" />}
                            {isSubmitting ? 'Submitting...' : 'Submit'}
                        </button>
                    )}
                </div>

                {/* Footer Branding */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    marginTop: '40px',
                    paddingTop: '24px'
                }}>
                    <a
                        href="https://siodelhi.org"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            textDecoration: 'none',
                            transition: 'opacity 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    >
                        <img
                            src={sioLogo}
                            alt="SIO Delhi"
                            style={{
                                height: '48px',
                                width: 'auto'
                            }}
                        />
                    </a>
                </div>
            </form>

            <style>{`
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    )
}

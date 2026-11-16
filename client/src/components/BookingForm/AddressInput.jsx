import { useEffect, useRef, useState } from 'react'
import { searchAddress } from '../../utils/geocode'

// Fushë adrese me sugjerime nga OpenStreetMap
const AddressInput = ({ label, value, onChange, onSelect, placeholder, marker, active, onFocus, insideTirana = true }) => {
    const [results, setResults] = useState([])
    const [open, setOpen] = useState(false)
    const typed = useRef(false)

    useEffect(() => {
        if (!typed.current || value.trim().length < 3) return
        let cancelled = false
        const timer = setTimeout(async () => {
            const found = await searchAddress(value, { insideTirana })
            if (!cancelled) {
                setResults(found)
                setOpen(true)
            }
        }, 650)
        return () => { cancelled = true; clearTimeout(timer) }
    }, [value, insideTirana])

    return (
        <label className={`address-input ${active ? 'is-active' : ''}`}>
            <span className="address-input-label">{label}</span>
            <div className="address-input-row">
                <span className={`address-marker address-marker-${marker}`}>{marker === 'pickup' ? 'A' : 'B'}</span>
                <input
                    className="input"
                    value={value}
                    placeholder={placeholder}
                    onFocus={onFocus}
                    onBlur={() => setTimeout(() => setOpen(false), 150)}
                    onChange={(event) => { typed.current = true; onChange(event.target.value) }}
                    autoComplete="off"
                    maxLength={255}
                />
            </div>
            {open && results.length > 0 && (
                <ul className="address-results" role="listbox">
                    {results.map((result) => (
                        <li key={`${result.lat},${result.lng}`}>
                            <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => {
                                typed.current = false
                                setOpen(false)
                                onSelect(result)
                            }}>
                                <strong>{result.address}</strong>
                                <small>{result.label}</small>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </label>
    )
}

export default AddressInput

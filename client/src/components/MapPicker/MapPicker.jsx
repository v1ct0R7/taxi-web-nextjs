import { useEffect } from 'react'
import { Circle, MapContainer, Marker, Polyline, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import './MapPicker.css'

const pinIcon = (variant, label) => L.divIcon({
    className: '',
    html: `<div class="map-pin map-pin-${variant}"><span>${label}</span></div>`,
    iconSize: [34, 44],
    iconAnchor: [17, 42],
})

const pickupIcon = pinIcon('pickup', 'A')
const dropoffIcon = pinIcon('dropoff', 'B')

const ClickHandler = ({ onPick }) => {
    useMapEvents({ click: (event) => onPick({ lat: event.latlng.lat, lng: event.latlng.lng }) })
    return null
}

const FitPoints = ({ pickup, dropoff }) => {
    const map = useMap()
    useEffect(() => {
        if (pickup && dropoff) {
            map.fitBounds([[pickup.lat, pickup.lng], [dropoff.lat, dropoff.lng]], { padding: [60, 60], maxZoom: 15 })
        } else if (pickup || dropoff) {
            const point = pickup || dropoff
            map.flyTo([point.lat, point.lng], Math.max(map.getZoom(), 14), { duration: .6 })
        }
    }, [map, pickup, dropoff])
    return null
}

const MapPicker = ({ center, radiusKm, pickup, dropoff, onPick, showDropoff = true }) => {
    const start = center ? [center.lat, center.lng] : [41.3275, 19.8187]
    return (
        <div className="map-picker">
            <MapContainer center={start} zoom={13} scrollWheelZoom className="map-picker-canvas" attributionControl>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                {radiusKm && <Circle center={start} radius={radiusKm * 1000} pathOptions={{ color: '#e9b949', weight: 1, opacity: .45, fillOpacity: .03, dashArray: '6 8' }} />}
                {pickup && <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon} />}
                {showDropoff && dropoff && <Marker position={[dropoff.lat, dropoff.lng]} icon={dropoffIcon} />}
                {showDropoff && pickup && dropoff && (
                    <Polyline positions={[[pickup.lat, pickup.lng], [dropoff.lat, dropoff.lng]]} pathOptions={{ color: '#e9b949', weight: 3, dashArray: '2 8', lineCap: 'round' }} />
                )}
                {onPick && <ClickHandler onPick={onPick} />}
                <FitPoints pickup={pickup} dropoff={showDropoff ? dropoff : null} />
            </MapContainer>
        </div>
    )
}

export default MapPicker

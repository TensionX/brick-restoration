// Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoidmxhZGh1IiwiYSI6ImNtMTcxOXhieDBsMHUybHF4bmRzMXlpOHUifQ.qfbmyIpKmCbjFGEtcxkTwQ';

document.addEventListener('DOMContentLoaded', () => {
    const addressForm = document.getElementById('addressForm');
    const resultDiv = document.getElementById('result');
    const calendlyWidget = document.getElementById('calendlyWidget');
    const areaNameElement = document.getElementById('areaName');
    const coordinatesElement = document.createElement('p');
    coordinatesElement.id = 'coordinates';
    areaNameElement.parentNode.insertBefore(coordinatesElement, areaNameElement.nextSibling);

    // Contact form elements
    const contactForm = document.getElementById('contactForm');
    const contactResult = document.getElementById('contactResult');

    addressForm.addEventListener('submit', async (e) => {
        try {
            console.log('Form submitted');
            e.preventDefault();
            const address = document.getElementById('address').value;

            const coordinates = await getCoordinates(address);
            console.log('Coordinates returned by Mapbox:', coordinates);
            const area = identifyArea(coordinates);
            console.log('Identified area:', area);
            
            if (area) {
                showResults(coordinates, area);
                resultDiv.classList.remove('d-none');
            } else {
                throw new Error('Area not identified');
            }
        } catch (error) {
            console.error('Error in form submission:', error);
            alert('An error occurred while processing your request. Please try again.');
        }
    });

    // Contact form submission handler
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const message = document.getElementById('message').value;

        // Here you would typically send this data to a server
        // For this example, we'll just log it and show a success message
        console.log('Contact form submitted:', { name, email, message });

        contactResult.textContent = 'Thank you for your message. We will get back to you soon!';
        contactResult.classList.remove('d-none');
        contactForm.reset();

        // Hide the success message after 5 seconds
        setTimeout(() => {
            contactResult.classList.add('d-none');
        }, 5000);
    });

    async function getCoordinates(address) {
        try {
            console.log('Using Mapbox access token:', mapboxgl.accessToken ? 'Token is set' : 'Token is not set');
            const apiUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${mapboxgl.accessToken}`;
            console.log('Mapbox API URL:', apiUrl);
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log('Full Mapbox API response:', data);
            
            if (data.features && data.features.length > 0) {
                return data.features[0].center;
            } else {
                throw new Error(`Address not found: ${address}`);
            }
        } catch (error) {
            console.error('Error in getCoordinates:', error);
            throw error;
        }
    }

    function isPointInPolygon(point, polygon) {
        const [x, y] = point;
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const [xi, yi] = polygon[i];
            const [xj, yj] = polygon[j];
            const intersect = ((yi > y) !== (yj > y))
                && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }

    function identifyArea(coordinates) {
        const [longitude, latitude] = coordinates;
        for (const [area, polygon] of Object.entries(areaCoordinates)) {
            if (isPointInPolygon([longitude, latitude], polygon)) {
                return area;
            }
        }
        console.log('Coordinates do not fall within any defined area');
        return null;
    }

    function showResults(coordinates, area) {
        console.log('Showing results for area:', area);
        const [longitude, latitude] = coordinates;
        areaNameElement.textContent = `Identified Area: ${area}`;
        coordinatesElement.textContent = `Coordinates: [${longitude.toFixed(6)}, ${latitude.toFixed(6)}]`;
        showCalendlyWidget(area);
    }

    function showCalendlyWidget(area) {
        console.log('Showing Calendly widget for area:', area);
        const calendlyUrl = `${calendlyLinks[area]}?hide_event_type_details=1&hide_gdpr_banner=1`;
        calendlyWidget.innerHTML = `
            <div class="calendly-inline-widget" data-url="${calendlyUrl}"></div>
        `;
        const script = document.createElement('script');
        script.src = 'https://assets.calendly.com/assets/external/widget.js';
        script.async = true;
        script.onload = () => console.log('Calendly script loaded');
        script.onerror = (error) => console.error('Error loading Calendly script:', error);
        document.body.appendChild(script);
    }
});

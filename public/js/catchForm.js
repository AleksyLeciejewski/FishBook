document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('catchForm');
    const imageInput = document.getElementById('image');
    const imagePreview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('preview');
    const locationName = document.getElementById('locationName');
    const latitude = document.getElementById('latitude');
    const longitude = document.getElementById('longitude');
    const useCurrentLocationBtn = document.getElementById('useCurrentLocation');
    
    // Image preview
    if (imageInput) {
        imageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    previewImg.src = e.target.result;
                    imagePreview.classList.remove('hidden');
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Get current location
    if (useCurrentLocationBtn) {
        useCurrentLocationBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude: lat, longitude: lng } = position.coords;
                        latitude.value = lat;
                        longitude.value = lng;
                        
                        // Reverse geocode to get location name
                        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`)
                            .then(response => response.json())
                            .then(data => {
                                if (data.address) {
                                    const name = data.address.water || data.address.river || 
                                               data.address.lake || data.address.village || 
                                               data.address.town || data.address.city || 
                                               'My Location';
                                    locationName.value = name;
                                }
                            });
                    },
                    (error) => {
                        alert('Unable to retrieve your location: ' + error.message);
                    }
                );
            } else {
                alert('Geolocation is not supported by your browser');
            }
        });
    }

    // Form submission
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(form);
            
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('/catches', {
                    method: 'POST',
                    headers: {
                        'x-auth-token': token
                    },
                    body: formData
                });

                const data = await response.json();

                if (response.ok) {
                    // Redirect to the catch detail page
                    window.location.href = `/catches/${data.catch._id}`;
                } else {
                    // Handle validation errors
                    if (data.errors) {
                        alert(data.errors.map(err => err.msg).join('\n'));
                    } else {
                        alert('Failed to create catch: ' + (data.message || 'Unknown error'));
                    }
                }
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred while submitting the form');
            }
        });
    }
});

 document.addEventListener('DOMContentLoaded', () => {

    const users = JSON.parse(localStorage.getItem('users')) || [];
    const requests = JSON.parse(localStorage.getItem('requests')) || [];
    const livesSavedCounter = localStorage.getItem('livesSaved') || 0;
    const reviews = JSON.parse(localStorage.getItem('reviews')) || [];
    const appointments = JSON.parse(localStorage.getItem('appointments')) || [];

    // --- Common Functions ---
    const showLoader = (show) => {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.style.display = show ? 'block' : 'none';
        }
    };

    const saveToLocalStorage = (key, data) => {
        localStorage.setItem(key, JSON.stringify(data));
    };

    const getCurrentUser = () => {
        return JSON.parse(localStorage.getItem('currentUser'));
    };

    const logoutUser = () => {
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    };

    // --- Scroll Spy Logic for index.html ---
    if (document.body.id === 'index-page') { // Add an ID to your body tag in index.html, e.g., <body id="index-page">
        const sections = document.querySelectorAll('main, section.info-section');
        const navLinks = document.querySelectorAll('nav .nav-link');

        const highlightNavLink = () => {
            let current = '';
            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.clientHeight;
                if (scrollY >= sectionTop - 100) { // Offset for header height
                    current = section.getAttribute('id');
                }
            });

            navLinks.forEach(link => {
                link.classList.remove('active-nav');
                if (link.href.includes(current)) {
                    link.classList.add('active-nav');
                }
            });
        };

        window.addEventListener('scroll', highlightNavLink);
        highlightNavLink(); // Call on load to set initial active link
    }
    // --- End Scroll Spy Logic ---
    
    // index.html
    if (document.querySelector('.hero-slogan')) {
        document.querySelector('.hero-slogan').style.animationPlayState = 'running';
    }

    // register.html
    const registrationForm = document.getElementById('registrationForm');
    if (registrationForm) {
        registrationForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const newUser = {
                name: document.getElementById('name').value,
                age: document.getElementById('age').value,
                gender: document.getElementById('gender').value,
                bloodGroup: document.getElementById('bloodGroup').value,
                phone: document.getElementById('phone').value,
                email: document.getElementById('email').value,
                city: document.getElementById('city').value,
                password: document.getElementById('password').value,
                userType: document.getElementById('userType').value,
                status: 'Available' // Default for new donors
            };

            const userExists = users.some(user => user.email === newUser.email);
            if (userExists) {
                alert('User with this email already exists!');
                return;
            }

            users.push(newUser);
            saveToLocalStorage('users', users);
            alert('Registration successful! You can now log in.');
            window.location.href = 'login.html';
        });
    }

    // login.html
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            const user = users.find(u => u.email === email && u.password === password);
            if (user) {
                saveToLocalStorage('currentUser', user);
                window.location.href = 'dashboard.html';
            } else {
                alert('Invalid email or password.');
            }
        });
    }

    // dashboard.html
    const dashboardContainer = document.querySelector('.dashboard-container');
    if (dashboardContainer) {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            window.location.href = 'login.html'; // Redirect if not logged in
            return;
        }

        document.getElementById('userName').textContent = currentUser.name;
        const userDetails = document.getElementById('userDetails');
        userDetails.innerHTML = `
            <p><strong>Email:</strong> ${currentUser.email}</p>
            <p><strong>Blood Group:</strong> ${currentUser.bloodGroup}</p>
            <p><strong>City:</strong> ${currentUser.city}</p>
        `;

        if (currentUser.userType === 'donor') {
            document.getElementById('donorActions').style.display = 'block';
            const donorStatusSelect = document.getElementById('donorStatus');
            donorStatusSelect.value = currentUser.status;

            document.getElementById('updateStatusBtn').addEventListener('click', () => {
                const newStatus = donorStatusSelect.value;
                currentUser.status = newStatus;
                saveToLocalStorage('currentUser', currentUser);
                const userIndex = users.findIndex(u => u.email === currentUser.email);
                if (userIndex !== -1) {
                    users[userIndex] = currentUser;
                    saveToLocalStorage('users', users);
                    alert('Status updated successfully!');
                }
            });
        } else if (currentUser.userType === 'receiver') {
            document.getElementById('receiverRequests').style.display = 'block';
            const userRequests = requests.filter(req => req.requesterEmail === currentUser.email);
            const requestListDiv = document.getElementById('requestList');
            if (userRequests.length > 0) {
                userRequests.forEach(req => {
                    const reqCard = document.createElement('div');
                    reqCard.className = 'card';
                    reqCard.innerHTML = `
                        <h4>Request for ${req.bloodGroup} Blood</h4>
                        <p><strong>Units:</strong> ${req.units}</p>
                        <p><strong>Hospital:</strong> ${req.hospitalName}</p>
                        <p><strong>City:</strong> ${req.city}</p>
                        <p><strong>Status:</strong> ${req.fulfilled ? 'Fulfilled 🎉' : 'Pending...'}</p>
                        ${!req.fulfilled ? `<button class="fulfill-btn" data-id="${req.id}">Mark as Fulfilled</button>` : ''}
                    `;
                    requestListDiv.appendChild(reqCard);
                });

                document.querySelectorAll('.fulfill-btn').forEach(button => {
                    button.addEventListener('click', (e) => {
                        const requestId = e.target.dataset.id;
                        const request = requests.find(r => r.id == requestId);
                        if (request && !request.fulfilled) {
                            request.fulfilled = true;
                            saveToLocalStorage('requests', requests);
                            let currentLives = parseInt(localStorage.getItem('livesSaved')) || 0;
                            currentLives++;
                            localStorage.setItem('livesSaved', currentLives);
                            alert('Request marked as fulfilled! Thank you.');
                            location.reload();
                        }
                    });
                });
            } else {
                requestListDiv.innerHTML = '<p>You have not made any requests yet.</p>';
            }
        }
        
        document.getElementById('logoutBtn').addEventListener('click', logoutUser);
    }

    // request.html
    const requestForm = document.getElementById('requestForm');
    if (requestForm) {
        requestForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const newRequest = {
                id: Date.now(),
                patientName: document.getElementById('patientName').value,
                bloodGroup: document.getElementById('requestBloodGroup').value,
                units: document.getElementById('units').value,
                hospitalName: document.getElementById('hospitalName').value,
                city: document.getElementById('requestCity').value,
                contact: document.getElementById('contact').value,
                requesterEmail: getCurrentUser() ? getCurrentUser().email : null,
                fulfilled: false
            };

            requests.push(newRequest);
            saveToLocalStorage('requests', requests);
            alert('Blood request submitted successfully!');

            matchDonors(newRequest);
            requestForm.reset();
        });

        const matchDonors = (request) => {
            const matchedDonorsDiv = document.getElementById('matchedDonors');
            const donorMatchesList = document.getElementById('donorMatchesList');
            donorMatchesList.innerHTML = '';
            
            const matched = users.filter(user => 
                user.userType === 'donor' && 
                user.status === 'Available' && 
                user.bloodGroup === request.bloodGroup && 
                user.city.toLowerCase() === request.city.toLowerCase()
            );

            if (matched.length > 0) {
                matched.forEach(donor => {
                    const donorCard = document.createElement('div');
                    donorCard.className = 'card';
                    donorCard.innerHTML = `
                        <h4>${donor.name}</h4>
                        <p><strong>Blood Group:</strong> ${donor.bloodGroup}</p>
                        <p><strong>City:</strong> ${donor.city}</p>
                        <p><strong>Contact:</strong> ${donor.phone}</p>
                    `;
                    donorMatchesList.appendChild(donorCard);
                });
                matchedDonorsDiv.style.display = 'block';
            } else {
                donorMatchesList.innerHTML = '<p>Sorry, no matching donors found at this time. Please check back later.</p>';
                matchedDonorsDiv.style.display = 'block';
            }
        };
    }

    // donors.html
    const donorsListDiv = document.getElementById('donorsList');
    if (donorsListDiv) {
        const displayDonors = (filteredDonors) => {
            donorsListDiv.innerHTML = '';
            if (filteredDonors.length > 0) {
                filteredDonors.forEach(donor => {
                    const donorCard = document.createElement('div');
                    donorCard.className = 'card';
                    donorCard.innerHTML = `
                        <h4>${donor.name}</h4>
                        <p><strong>Blood Group:</strong> ${donor.bloodGroup}</p>
                        <p><strong>City:</strong> ${donor.city}</p>
                        <p><strong>Status:</strong> <span class="status-${donor.status.replace(' ', '-')}">${donor.status}</span></p>
                    `;
                    donorsListDiv.appendChild(donorCard);
                });
            } else {
                donorsListDiv.innerHTML = '<p>No donors match your search criteria.</p>';
            }
        };

        const filterDonors = () => {
            const searchCity = document.getElementById('searchCity').value.toLowerCase();
            const filterBloodGroup = document.getElementById('filterBloodGroup').value;

            const availableDonors = users.filter(user => user.userType === 'donor' && user.status === 'Available');

            const filtered = availableDonors.filter(donor => {
                const cityMatch = donor.city.toLowerCase().includes(searchCity);
                const bloodGroupMatch = filterBloodGroup === '' || donor.bloodGroup === filterBloodGroup;
                return cityMatch && bloodGroupMatch;
            });
            displayDonors(filtered);
        };

        document.getElementById('searchCity').addEventListener('input', filterDonors);
        document.getElementById('filterBloodGroup').addEventListener('change', filterDonors);

        filterDonors(); // Initial display
    }

    // lives.html
    const livesSavedSpan = document.getElementById('livesSavedCounter');
    if (livesSavedSpan) {
        livesSavedSpan.textContent = livesSavedCounter;
    }
    // reviews.html
    const reviewForm = document.getElementById('reviewForm');
    const reviewsListDiv = document.getElementById('reviewsList');

    if (reviewForm && reviewsListDiv) {
        // Function to display reviews
        const displayReviews = () => {
            reviewsListDiv.innerHTML = '';
            if (reviews.length === 0) {
                reviewsListDiv.innerHTML = '<p>No reviews have been submitted yet. Be the first to share your experience!</p>';
                return;
            }
            reviews.reverse().forEach(review => {
                const reviewCard = document.createElement('div');
                reviewCard.className = 'review-card';
                
                let stars = '';
                for (let i = 0; i < review.rating; i++) {
                    stars += '★';
                }
                
                reviewCard.innerHTML = `
                    <h4>${stars}</h4>
                    <p><em>- Reviewed by ${review.name}</em></p>
                    <p>${review.content}</p>
                `;
                reviewsListDiv.appendChild(reviewCard);
            });
        };

        // Handle form submission
        reviewForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const newReview = {
                id: Date.now(),
                name: document.getElementById('reviewName').value,
                rating: document.querySelector('input[name="rating"]:checked').value,
                content: document.getElementById('reviewContent').value,
            };

            reviews.push(newReview);
            saveToLocalStorage('reviews', reviews);

            alert('Thank you for your review!');
            reviewForm.reset();
            displayReviews();
        });

        // Display reviews on page load
        displayReviews();
    }
    // appointment.html
    const appointmentForm = document.getElementById('appointmentForm');
    if (appointmentForm) {
        const currentUser = getCurrentUser();
        if (currentUser) {
            document.getElementById('contactEmail').value = currentUser.email;
            document.getElementById('fullName').value = currentUser.name;
        }

        appointmentForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const newAppointment = {
                fullName: document.getElementById('fullName').value,
                date: document.getElementById('appointmentDate').value,
                time: document.getElementById('appointmentTime').value,
                donationCenter: document.getElementById('donationCenter').value,
                email: document.getElementById('contactEmail').value,
                id: Date.now()
            };

            appointments.push(newAppointment);
            saveToLocalStorage('appointments', appointments);

            const messageBox = document.getElementById('appointment-message');
            messageBox.textContent = `Appointment confirmed for ${newAppointment.date} at ${newAppointment.time}. Thank you!`;
            messageBox.style.display = 'block';
            
            appointmentForm.reset();
        });
    }
});
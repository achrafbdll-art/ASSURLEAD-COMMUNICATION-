import * as THREE from 'three';
import { GoogleGenAI } from "@google/genai";

document.addEventListener('DOMContentLoaded', () => {
    // --- UTILS ---
    const setupResizeHandler = (container, camera, renderer) => {
        const observer = new ResizeObserver(() => {
            const width = container.clientWidth;
            const height = container.clientHeight;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        });
        observer.observe(container);
        return observer;
    };

    // --- HERO & CONTACT 3D SCENES ---
    const init3DHeroStyle = (containerId) => {
        const container = document.getElementById(containerId);
        if (!container) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(renderer.domElement);

        const geometry = new THREE.IcosahedronGeometry(2, 1);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x00ff00, 
            wireframe: true,
            emissive: 0x00ff00,
            emissiveIntensity: 0.8
        });
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        const particlesGeometry = new THREE.BufferGeometry();
        const particlesCount = 500;
        const posArray = new Float32Array(particlesCount * 3);
        const randArray = new Float32Array(particlesCount);
        
        for(let i=0; i<particlesCount * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * 10;
        }
        for(let i=0; i<particlesCount; i++) {
            randArray[i] = Math.random();
        }
        
        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        const particlesMaterial = new THREE.PointsMaterial({ size: 0.02, color: 0x00ff00 });
        const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
        scene.add(particlesMesh);

        const light = new THREE.PointLight(0x00ff00, 100);
        light.position.set(5, 5, 5);
        scene.add(light);
        scene.add(new THREE.AmbientLight(0xffffff, 0.2));

        camera.position.z = 5;

        let frameId;
        function animate() {
            frameId = requestAnimationFrame(animate);
            mesh.rotation.x += 0.002;
            mesh.rotation.y += 0.003;
            particlesMesh.rotation.y += 0.001;
            renderer.render(scene, camera);
        }
        animate();

        setupResizeHandler(container, camera, renderer);
    };

    // --- 3D ROI SCENE ---
    let roiBar;
    let currencySymbols = [];
    const initROIScene = () => {
        const container = document.getElementById('roi-canvas-container');
        if (!container) return;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x050505);
        const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(renderer.domElement);

        // Grid
        const grid = new THREE.GridHelper(20, 20, 0x00ff00, 0x111111);
        grid.position.y = -2;
        scene.add(grid);

        // Single Hexagonal Neon Pillar
        const hexSegments = 6;
        const outerGeometry = new THREE.CylinderGeometry(1.2, 1.2, 4, hexSegments);
        const innerGeometry = new THREE.CylinderGeometry(0.6, 0.6, 4, hexSegments);
        
        const outerMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x00ff00, 
            transparent: true, 
            opacity: 0.2,
            metalness: 0.9,
            roughness: 0.1
        });
        
        const innerMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x00ff00, 
            emissive: 0x00ff00, 
            emissiveIntensity: 1
        });

        roiBar = new THREE.Group();
        const outerMesh = new THREE.Mesh(outerGeometry, outerMaterial);
        const innerMesh = new THREE.Mesh(innerGeometry, innerMaterial);
        
        const wireframeGeometry = new THREE.EdgesGeometry(outerGeometry);
        const wireframeMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.8 });
        const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
        
        roiBar.add(outerMesh);
        roiBar.add(innerMesh);
        roiBar.add(wireframe);
        
        roiBar.position.y = -2;
        roiBar.scale.y = 0.1;
        
        scene.add(roiBar);

        // Tornado Currency Symbols
        const createSymbolTexture = (text) => {
            const canvas = document.createElement('canvas');
            canvas.width = 128;
            canvas.height = 128;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, 128, 128);
            ctx.font = 'bold 80px Inter, sans-serif';
            ctx.fillStyle = '#00ff00';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, 64, 64);
            return new THREE.CanvasTexture(canvas);
        };

        const madTexture = createSymbolTexture('MAD');
        const dollarTexture = createSymbolTexture('$');

        for (let i = 0; i < 40; i++) {
            const sprMat = new THREE.SpriteMaterial({ 
                map: i % 2 === 0 ? madTexture : dollarTexture,
                transparent: true,
                opacity: 0.8
            });
            const sprite = new THREE.Sprite(sprMat);
            
            const angle = Math.random() * Math.PI * 2;
            const radius = 2 + Math.random() * 4;
            const height = (Math.random() - 0.5) * 10;
            
            sprite.position.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
            sprite.scale.set(0.5, 0.5, 1);
            sprite.userData = {
                angle, radius,
                speed: 0.01 + Math.random() * 0.02,
                vSpeed: (Math.random() - 0.5) * 0.01
            };
            
            scene.add(sprite);
            currencySymbols.push(sprite);
        }

        const light = new THREE.PointLight(0x00ff00, 50);
        light.position.set(5, 5, 5);
        scene.add(light);
        scene.add(new THREE.AmbientLight(0xffffff, 0.5));

        camera.position.set(0, 5, 12);
        camera.lookAt(0, 0, 0);

        function animate() {
            requestAnimationFrame(animate);
            currencySymbols.forEach(symbol => {
                symbol.userData.angle += symbol.userData.speed;
                symbol.position.x = Math.cos(symbol.userData.angle) * symbol.userData.radius;
                symbol.position.z = Math.sin(symbol.userData.angle) * symbol.userData.radius;
                symbol.position.y += symbol.userData.vSpeed;
                
                if (symbol.position.y > 5) symbol.position.y = -5;
                if (symbol.position.y < -5) symbol.position.y = 5;
            });
            renderer.render(scene, camera);
        }
        animate();

        setupResizeHandler(container, camera, renderer);
    };

    // ROI Calculator Logic
    const budgetInput = document.getElementById('budget-input');
    const convInput = document.getElementById('conv-input');
    const budgetVal = document.getElementById('budget-val');
    const convVal = document.getElementById('conv-val');
    const revenueDisplay = document.getElementById('revenue-display');
    const roiDisplay = document.getElementById('roi-display');
    const leadsCount = document.getElementById('leads-count');
    const salesCount = document.getElementById('sales-count');

    const updateROI = () => {
        if (!budgetInput || !convInput) return;
        const budget = parseInt(budgetInput.value);
        const conv = parseInt(convInput.value);
        
        const leads = Math.floor(budget / 15);
        const sales = Math.floor(leads * (conv / 100));
        const revenue = sales * 1200;
        const roi = ((revenue - budget) / budget) * 100;

        budgetVal.innerText = budget.toLocaleString() + ' MAD';
        convVal.innerText = conv + '%';
        revenueDisplay.innerText = Math.floor(revenue).toLocaleString() + ' MAD';
        roiDisplay.innerText = '+' + Math.floor(roi) + '%';
        
        if (leadsCount) leadsCount.innerText = leads.toLocaleString();
        if (salesCount) salesCount.innerText = sales.toLocaleString();

        // Update 3D Bar
        if (roiBar) {
            const targetHeight = Math.max(0.1, (revenue / 20000) * 3);
            roiBar.scale.y = targetHeight;
            roiBar.position.y = -2 + (targetHeight * 2); 
            
            // Update materials
            const outerMesh = roiBar.children[0];
            const innerMesh = roiBar.children[1];
            if (innerMesh && innerMesh.material) {
                innerMesh.material.emissiveIntensity = 0.5 + (targetHeight / 2);
            }
            if (outerMesh && outerMesh.material) {
                outerMesh.material.opacity = 0.1 + (targetHeight / 10);
            }
        }

        // Update Tornado Intensity
        if (currencySymbols.length > 0) {
            const intensity = Math.min(2, revenue / 10000);
            currencySymbols.forEach(symbol => {
                symbol.material.opacity = 0.3 + (intensity * 0.3);
                symbol.scale.set(0.3 + intensity * 0.2, 0.3 + intensity * 0.2, 1);
            });
        }
    };

    if (budgetInput) budgetInput.addEventListener('input', updateROI);
    if (convInput) convInput.addEventListener('input', updateROI);

    // Navbar scroll effect
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 20) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }, { passive: true });

    // Mobile Menu
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
        });

        // Close menu when clicking a link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }

    // Lead Ticker
    const ticker = document.getElementById('lead-ticker');
    const tickerName = document.getElementById('ticker-name');
    const tickerMeta = document.getElementById('ticker-meta');
    const leads = [
        { name: "Ahmed B.", city: "Casablanca", time: "à l'instant" },
        { name: "Sara M.", city: "Rabat", time: "il y a 2 min" },
        { name: "Youssef K.", city: "Marrakech", time: "il y a 5 min" },
        { name: "Inès T.", city: "Tanger", time: "il y a 1 min" },
    ];

    function updateTicker() {
        if (!ticker) return;
        const lead = leads[Math.floor(Math.random() * leads.length)];
        ticker.classList.remove('active');
        setTimeout(() => {
            tickerName.textContent = `${lead.name} vient de s'inscrire`;
            tickerMeta.textContent = `${lead.city} • ${lead.time}`;
            ticker.classList.add('active');
        }, 500);
    }
    setInterval(updateTicker, 8000);
    setTimeout(updateTicker, 2000);

    // Modal
    const modal = document.getElementById('cta-modal');
    const closeModal = document.getElementById('close-modal');
    if (modal && closeModal) {
        const showModal = () => {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        };
        const hideModal = () => {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        };
        closeModal.addEventListener('click', hideModal);
        modal.querySelector('.modal-backdrop').addEventListener('click', hideModal);

        let modalTriggered = false;
        const triggerModal = () => {
            if (!modalTriggered) {
                showModal();
                modalTriggered = true;
                window.removeEventListener('click', triggerModal);
            }
        };
        window.addEventListener('click', triggerModal);
        setTimeout(() => { if (!modalTriggered) showModal(); }, 8000);
    }

    // --- FORM HANDLING ---
    const initQuestionnaire = () => {
        const form = document.getElementById('questionnaire');
        if (!form) return;

        const steps = form.querySelectorAll('.form-step');
        const dots = document.querySelectorAll('.step-dot');
        let currentStep = 0;

        const updateSteps = () => {
            steps.forEach((s, i) => {
                const isActive = i === currentStep;
                s.classList.toggle('hidden', !isActive);
                if (isActive) {
                    s.classList.add('fade-in');
                    const firstInput = s.querySelector('input, textarea');
                    if (firstInput) firstInput.focus();
                }
            });
            dots.forEach((d, i) => d.classList.toggle('active', i <= currentStep));
        };

        const validateStep = () => {
            const inputs = steps[currentStep].querySelectorAll('input, textarea');
            let valid = true;
            inputs.forEach(input => {
                if (input.hasAttribute('required') && !input.value.trim()) {
                    valid = false;
                    input.classList.add('error-shake');
                    input.style.borderColor = 'var(--error-red, #ff4136)';
                    setTimeout(() => input.classList.remove('error-shake'), 500);
                } else {
                    input.style.borderColor = '';
                }
            });
            return valid;
        };

        form.querySelectorAll('.next-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                if (validateStep() && currentStep < steps.length - 1) {
                    currentStep++;
                    updateSteps();
                }
            });
        });

        form.querySelectorAll('.prev-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                if (currentStep > 0) {
                    currentStep--;
                    updateSteps();
                }
            });
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!validateStep()) return;
            
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ENVOI...';

            // Simulate API call
            setTimeout(() => {
                alert('Merci ! Votre demande a été envoyée. Notre équipe vous recontactera sous 24h.');
                form.reset();
                currentStep = 0;
                updateSteps();
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }, 1500);
        });
    };

    // Projects Navigation
    const navProjets = document.getElementById('nav-projets');
    const projetsSection = document.getElementById('projets');
    if (navProjets && projetsSection) {
        navProjets.addEventListener('click', (e) => {
            e.preventDefault();
            projetsSection.classList.toggle('hidden');
            if (!projetsSection.classList.contains('hidden')) {
                projetsSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    // Dynamic Hero Dashboard
    const updateHeroDashboard = () => {
        const bars = document.querySelectorAll('.chart .bar');
        const leadStat = document.querySelector('.stat-box .stat-val.neon');
        
        if (bars.length > 0) {
            bars.forEach(bar => {
                const height = Math.floor(Math.random() * 60) + 40;
                bar.style.height = height + '%';
            });
        }
        
        if (leadStat) {
            const current = parseInt(leadStat.textContent.replace('+', ''));
            const next = current + (Math.random() > 0.7 ? 1 : 0);
            leadStat.textContent = '+' + next;
        }
    };
    setInterval(updateHeroDashboard, 5000);

    // --- CHATBOT YACINE ---
    const chatToggle = document.getElementById('chat-toggle');
    const chatWindow = document.getElementById('chat-window');
    const chatClose = document.getElementById('chat-close');
    const chatInput = document.getElementById('chat-input');
    const chatSend = document.getElementById('chat-send');
    const chatMessages = document.getElementById('chat-messages');
    const chatSuggestions = document.getElementById('chat-suggestions');

    // Context tracking for proactive suggestions
    let chatHistory = [];
    let userInteractions = {
        askedPricing: false,
        viewedROI: false,
        viewedProjects: false,
        isAgent: false
    };

    const suggestions = {
        initial: ["Comment ça marche ?", "Quels tarifs ?", "Voir des exemples", "Simuler mon ROI"],
        pricing: ["Pack Starter", "Pack Growth", "Pack Scale", "Audit gratuit"],
        projects: ["Assurances El Omrani", "Témoignages", "Comment démarrer ?"],
        roisim: ["Calculer mon revenu", "Taux de conversion ?", "Stratégie Ads"]
    };

    const showSuggestions = (type = 'initial') => {
        if (!chatSuggestions) return;
        chatSuggestions.innerHTML = '';
        const list = suggestions[type] || suggestions.initial;
        
        list.forEach(text => {
            const btn = document.createElement('button');
            btn.className = 'suggestion-btn';
            btn.textContent = text;
            btn.onclick = () => {
                chatInput.value = text;
                handleChat();
            };
            chatSuggestions.appendChild(btn);
        });
        
        chatSuggestions.classList.remove('hidden');
    };

    if (chatToggle && chatWindow && chatClose) {
        chatToggle.addEventListener('click', () => {
            chatWindow.classList.toggle('hidden');
            if (!chatWindow.classList.contains('hidden')) {
                chatInput.focus();
                if (chatMessages.children.length <= 1) {
                    showSuggestions('initial');
                }
            }
        });

        chatClose.addEventListener('click', () => {
            chatWindow.classList.add('hidden');
        });
    }

    const addMessage = (text, sender) => {
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message', sender);
        msgDiv.textContent = text;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const handleChat = async () => {
        const text = chatInput.value.trim();
        if (!text) return;

        addMessage(text, 'user');
        chatInput.value = '';
        chatHistory.push({ role: "user", parts: [{ text }] });
        chatSuggestions.classList.add('hidden');

        // Interaction Tracking for better AI context
        const lowerText = text.toLowerCase();
        if (/tarif|prix|mad|combien|coût/.test(lowerText)) userInteractions.askedPricing = true;
        if (/projet|exemple|réalisation|portfolio/.test(lowerText)) userInteractions.viewedProjects = true;
        if (/roi|calcul|simulateur|prévision/.test(lowerText)) userInteractions.viewedROI = true;

        const loadingDiv = document.createElement('div');
        loadingDiv.classList.add('message', 'bot', 'loading');
        loadingDiv.textContent = 'Yacine réfléchit...';
        chatMessages.appendChild(loadingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        try {
            let apiKey = null;
            try {
                apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            } catch (e) {}

            if (!apiKey) {
                try {
                    apiKey = process.env.GEMINI_API_KEY;
                } catch (e) {}
            }

            if (!apiKey) {
                throw new Error("Clé API Gemini manquante. Veuillez configurer la variable d'environnement VITE_GEMINI_API_KEY ou GEMINI_API_KEY.");
            }

            const ai = new GoogleGenAI({ 
                apiKey: apiKey,
                httpOptions: {
                    headers: {
                        'User-Agent': 'aistudio-build'
                    }
                }
            });

            const response = await ai.models.generateContent({
                model: "gemini-3.5-flash",
                contents: chatHistory,
                config: {
                    systemInstruction: `Tu es Yacine, l'assistant IA expert de l'agence de marketing digital "AssurLead" au Maroc. 
                    Ton persona : Empathique, Expert, Proactif.
                    Ta mission : Aider les agents d'assurance à capter plus de leads via nos solutions (Mini Express, Starter, Growth, Scale).
                    Ta règle d'or : Sois précis sur les tarifs (à partir de 1200 MAD) et encourage l'usage du simulateur ROI.
                    Contexte : ${JSON.stringify(userInteractions)}.`,
                    temperature: 0.8,
                    topP: 0.95,
                    topK: 40,
                    maxOutputTokens: 1024,
                }
            });

            const botResponse = response.text || "Désolé, je n'ai pas pu générer de réponse.";

            chatMessages.removeChild(loadingDiv);
            addMessage(botResponse, 'bot');
            chatHistory.push({ role: "model", parts: [{ text: botResponse }] });

            // Post-response suggestions
            setTimeout(() => {
                const bText = botResponse.toLowerCase();
                if (/tarif|pack|mad/.test(bText)) showSuggestions('pricing');
                else if (/projet|exemple|réalisation/.test(bText)) showSuggestions('projects');
                else if (/roi|Calcul|simulateur/.test(bText)) showSuggestions('roisim');
                else showSuggestions('initial');
            }, 800);

        } catch (error) {
            console.error('Chat error:', error);
            if (loadingDiv.parentNode) chatMessages.removeChild(loadingDiv);
            if (error.message && error.message.includes("Clé API")) {
                addMessage(error.message, 'bot');
            } else {
                addMessage("Oups ! Une petite coupure technique. Je reviens vers vous dans un instant. En attendant, n'hésitez pas à simuler votre ROI !", 'bot');
            }
        }
    };

    if (chatSend) chatSend.addEventListener('click', handleChat);
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleChat();
        });
    }

    // --- LIVE LEAD TICKER ---
    const renderLeads = () => {
        const ticker = document.getElementById('lead-ticker');
        if (!ticker) return;

        const names = ["Amine B.", "Youssef K.", "Sara L.", "Hassan M.", "Imane T.", "Omar D."];
        const cities = ["Casablanca", "Rabat", "Marrakech", "Tangier", "Agadir"];
        const products = ["Auto", "Santé", "Habitation", "Retraite"];

        const showLead = () => {
            const name = names[Math.floor(Math.random() * names.length)];
            const city = cities[Math.floor(Math.random() * cities.length)];
            const product = products[Math.floor(Math.random() * products.length)];
            
            ticker.innerHTML = `
                <div class="ticker-icon"><i class="fas fa-bolt"></i></div>
                <div class="ticker-info">
                    <div class="ticker-label">Nouveau Lead Qualifié</div>
                    <div class="ticker-text"><strong>${name}</strong> (${city}) vient de demander un devis <strong>${product}</strong></div>
                </div>
            `;
            
            ticker.classList.add('active');
            
            setTimeout(() => {
                ticker.classList.remove('active');
            }, 5000);
        };

        // Initial delay
        setTimeout(() => {
            showLead();
            setInterval(showLead, 15000);
        }, 5000);
    };

    // Initialize items
    init3DHeroStyle('hero-canvas-container');
    initROIScene();
    initQuestionnaire();
    updateROI();
    renderLeads();
});

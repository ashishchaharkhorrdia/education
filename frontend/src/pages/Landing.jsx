import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Mic, Eye, Globe, CheckCircle, Smartphone, Zap, MessageSquare, Brain, Volume2 } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Landing = () => {
    const navigate = useNavigate();
    const { highContrast } = useAccessibility();

    return (
        <div className="min-h-screen bg-white high-contrast:bg-black font-sans">
            <Navbar />

            { }
            <section className="pt-32 pb-20 px-4 max-w-7xl mx-auto relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-50/50 rounded-full blur-3xl -z-10 high-contrast:hidden"></div>

                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div className="text-left">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 font-bold text-sm mb-8 border border-blue-100 high-contrast:bg-yellow-400 high-contrast:text-black high-contrast:border-none animate-in fade-in slide-in-from-bottom-5 duration-700">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                            AI-Powered Inclusive Learning
                        </div>

                        <h1 className="text-5xl md:text-6xl font-extrabold mb-8 tracking-tight leading-[1.1] text-gray-900 high-contrast:text-yellow-400 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                            Equal Learning. <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-indigo-600 to-violet-600 high-contrast:text-white">Equal Opportunity.</span>
                        </h1>

                        <p className="text-xl text-gray-600 mb-12 high-contrast:text-gray-300 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                            Accessible education designed for every ability. CyberNinjas adapts in real-time to support visual, hearing, motor, and cognitive needs.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                            <button
                                onClick={() => navigate('/signup')}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-full text-base font-bold transition-all transform hover:scale-105 shadow-lg hover:shadow-xl hover:shadow-blue-200 flex items-center justify-center gap-2 high-contrast:bg-yellow-400 high-contrast:text-black"
                            >
                                Start Learning Now
                            </button>
                            <button
                                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                                className="text-blue-600 border border-blue-200 hover:border-blue-600 px-8 py-3.5 rounded-full text-base font-bold transition-all bg-white hover:bg-blue-50 high-contrast:bg-transparent high-contrast:text-white high-contrast:border-white"
                            >
                                How It Works
                            </button>
                        </div>
                    </div>

                    <div className="relative animate-in fade-in zoom-in duration-1000">
                        <div className="rounded-3xl overflow-hidden shadow-2xl shadow-blue-100 high-contrast:shadow-none">
                            <img
                                src="/hero-students.png"
                                alt="Two students learning together with EqualEd"
                                className="w-full h-[460px] object-cover object-top"
                            />
                        </div>
                        {/* Floating Accessibility Score card */}
                        <div className="absolute -bottom-4 left-6 bg-white rounded-2xl shadow-xl px-5 py-4 min-w-[210px] high-contrast:bg-gray-900 high-contrast:border high-contrast:border-gray-700">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                                </div>
                                <span className="text-sm font-bold text-gray-800 high-contrast:text-white">Accessibility Score</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2 overflow-hidden">
                                <div className="bg-blue-600 h-full rounded-full" style={{ width: '98%' }}></div>
                            </div>
                            <p className="text-blue-600 font-bold text-sm high-contrast:text-yellow-400">98% Compliant</p>
                        </div>
                    </div>
                </div>
            </section>

            { }
            <section id="features" className="py-24 bg-gray-50 high-contrast:bg-gray-900">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-20 max-w-3xl mx-auto">
                        <h2 className="text-3xl font-bold text-blue-600 mb-2 high-contrast:text-yellow-400 uppercase tracking-wider text-sm">Key Features</h2>
                        <h3 className="text-4xl font-bold text-gray-900 mb-6 high-contrast:text-white">Assistive Tools for Every Learner</h3>
                        <p className="text-xl text-gray-600 high-contrast:text-gray-300">
                            Our platform includes a suite of powerful tools designed to make learning seamless and accessible.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            { icon: Volume2, title: "Text-to-Speech", desc: "Listen to any lesson content with natural sounding AI voices." },
                            { icon: Mic, title: "Speech-to-Text", desc: "Dictate answers and notes directly into the platform." },
                            { icon: Globe, title: "Adaptive Interface", desc: "UI that morphs font size, contrast, and layout automatically." },
                            { icon: Eye, title: "Eye Tracking", desc: "Navigate the entire site using only your eyes." },
                            { icon: Brain, title: "Cognitive Mode", desc: "Simplified layouts and focus tools for ADHD." },
                            { icon: MessageSquare, title: "Voice Assistant", desc: "Complex command execution via natural voice conversational AI." }
                        ].map((feature, i) => (
                            <div key={i} className="group p-8 rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 high-contrast:bg-black high-contrast:border-gray-800 high-contrast:hover:border-yellow-400">
                                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors high-contrast:bg-yellow-400 high-contrast:text-black high-contrast:group-hover:bg-yellow-300">
                                    <feature.icon size={32} />
                                </div>
                                <h4 className="text-xl font-bold mb-3 text-gray-900 high-contrast:text-white group-hover:text-blue-600 high-contrast:group-hover:text-yellow-400 transition-colors">{feature.title}</h4>
                                <p className="text-gray-500 high-contrast:text-gray-400 leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            { }
            <section id="how-it-works" className="py-24 bg-white high-contrast:bg-black">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-20">
                        <h2 className="text-3xl font-bold text-blue-600 mb-2 high-contrast:text-yellow-400 uppercase tracking-wider text-sm">Process</h2>
                        <h3 className="text-4xl font-bold text-gray-900 high-contrast:text-white">How It Works</h3>
                        <p className="text-xl text-gray-600 mt-4 high-contrast:text-gray-300">Simple steps to start your journey.</p>
                    </div>

                    <div className="grid md:grid-cols-4 gap-8 relative">
                        { }
                        <div className="hidden md:block absolute top-[60px] left-0 w-full h-1 bg-blue-100 high-contrast:bg-gray-800 -z-10"></div>

                        {[
                            { step: "01", title: "Select Profile", desc: "Choose your disability profile upon signup." },
                            { step: "02", title: "AI Adaptation", desc: "System automatically adjusts UI and tools." },
                            { step: "03", title: "Start Learning", desc: "Access lessons with TTS, STT, and more." },
                            { step: "04", title: "Track Growth", desc: "Monitor your improvements with detailed analytics." }
                        ].map((item, i) => (
                            <div key={i} className="relative text-center">
                                <div className="w-32 h-32 mx-auto bg-white rounded-full border-8 border-blue-50 flex items-center justify-center text-3xl font-bold text-blue-600 mb-6 shadow-sm high-contrast:bg-black high-contrast:border-gray-800 high-contrast:text-yellow-400">
                                    {item.step}
                                </div>
                                <h4 className="text-xl font-bold text-gray-900 mb-3 high-contrast:text-white">{item.title}</h4>
                                <p className="text-gray-500 high-contrast:text-gray-400 px-4">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            { }
            <section id="about" className="py-24 bg-gray-50 high-contrast:bg-black">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-sm font-bold text-blue-600 mb-3 high-contrast:text-yellow-400 uppercase tracking-wider">Our Mission</h2>
                    <h3 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8 high-contrast:text-white">Bridging the Digital Learning Gap</h3>
                    <p className="text-xl text-gray-600 mb-16 leading-relaxed high-contrast:text-gray-300 max-w-2xl mx-auto">
                        EqualEd creates an inclusive learning experience by combining accessibility-first design with intelligent adaptive technology. Our platform ensures that no student is left behind.
                    </p>

                    { }
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-2xl mx-auto">
                        <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-8 text-left hover:shadow-lg transition-shadow high-contrast:bg-gray-900 high-contrast:border-gray-700">
                            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-5 high-contrast:bg-yellow-400 high-contrast:text-black">
                                <CheckCircle size={28} />
                            </div>
                            <h4 className="text-xl font-bold text-gray-900 mb-2 high-contrast:text-white">High Accessibility Standards</h4>
                            <p className="text-gray-500 high-contrast:text-gray-400">Built to meet and exceed WCAG 2.1 AA compliance for all learners.</p>
                        </div>
                        <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-8 text-left hover:shadow-lg transition-shadow high-contrast:bg-gray-900 high-contrast:border-gray-700">
                            <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-5 high-contrast:bg-yellow-400 high-contrast:text-black">
                                <Zap size={28} />
                            </div>
                            <h4 className="text-xl font-bold text-gray-900 mb-2 high-contrast:text-white">24/7 AI Assistance</h4>
                            <p className="text-gray-500 high-contrast:text-gray-400">Always-on intelligent support adapting to your unique learning needs.</p>
                        </div>
                    </div>
                </div>
            </section>

            { }
            <section id="contact" className="py-24 bg-blue-50 high-contrast:bg-gray-900 border-t border-gray-200 high-contrast:border-gray-800">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="bg-white rounded-3xl shadow-xl overflow-hidden high-contrast:bg-black high-contrast:border high-contrast:border-gray-700">
                        <div className="p-10 md:p-14">
                            <div className="text-center mb-10">
                                <h2 className="text-3xl font-bold text-gray-900 mb-4 high-contrast:text-yellow-400">Get in Touch</h2>
                                <p className="text-gray-600 high-contrast:text-gray-300">Have questions? We'd love to hear from you.</p>
                            </div>

                            <form className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2 high-contrast:text-white">Your Name</label>
                                        <input type="text" className="w-full px-5 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all high-contrast:bg-gray-900 high-contrast:text-white high-contrast:border-gray-700" placeholder="CyberNinja" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2 high-contrast:text-white">Email Address</label>
                                        <input type="email" className="w-full px-5 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all high-contrast:bg-gray-900 high-contrast:text-white high-contrast:border-gray-700" placeholder="cyberninja@gmail.com" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 high-contrast:text-white">Message</label>
                                    <textarea rows="4" className="w-full px-5 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all high-contrast:bg-gray-900 high-contrast:text-white high-contrast:border-gray-700" placeholder="How can we help you?"></textarea>
                                </div>
                                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all high-contrast:bg-yellow-400 high-contrast:text-black">
                                    Send Message
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default Landing;

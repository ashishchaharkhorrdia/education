import React from 'react';
import { Facebook, Twitter, Instagram, Linkedin, Heart } from 'lucide-react';
import logo from './logo.png';
import slogo from './Cyber ninjas.svg';


const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white pt-20 pb-10 border-t border-gray-800 high-contrast:bg-black high-contrast:border-yellow-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <img src={logo} alt="Cyberninjas Logo" className="h-14 w-14 object-contain" />
              <img src={slogo} alt="Cyberninjas Text Logo" className="h-14 w-auto object-contain" />
            </div>
            <p className="text-gray-400 mb-6 high-contrast:text-white leading-relaxed">
              Making education accessible to everyone, everywhere.  We believe in a world where disability is not a barrier to learning.
            </p>
            <div className="flex space-x-4">
              {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                <a key={i} href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-blue-600 hover:text-white transition-all high-contrast:bg-gray-700 high-contrast:text-yellow-400 high-contrast:hover:bg-yellow-400 high-contrast:hover:text-black">
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-bold text-white mb-6 high-contrast:text-yellow-400 text-lg">Quick Links</h4>
            <ul className="space-y-4 text-gray-400 high-contrast:text-gray-300">
              <li><a href="/" className="hover:text-blue-400 transition-colors">Home</a></li>
              <li><a href="#features" className="hover:text-blue-400 transition-colors">Features</a></li>
              <li><a href="#how-it-works" className="hover:text-blue-400 transition-colors">How it Works</a></li>
              <li><a href="#contact" className="hover:text-blue-400 transition-colors">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-6 high-contrast:text-yellow-400 text-lg">Resources</h4>
            <ul className="space-y-4 text-gray-400 high-contrast:text-gray-300">
              <li><a href="#" className="hover:text-blue-400 transition-colors">Accessibility Guide</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Community Forum</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Help Center</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-6 high-contrast:text-yellow-400 text-lg">Contact Us</h4>
            <ul className="space-y-4 text-gray-400 high-contrast:text-gray-300">
              <li className="flex gap-3">
                <span className="text-blue-500">✉️</span>
                <a href="mailto:contact@cyberninjas.com" className="hover:text-blue-400">contact@cyberninjas.com</a>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-500">📞</span>
                <span>9155337900</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-500">📍</span>
                <span>Bharat</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 high-contrast:border-gray-700">
          <p className="text-gray-500 text-sm high-contrast:text-gray-400">
            © 2026 CyberNinjas Inc. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-gray-500">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

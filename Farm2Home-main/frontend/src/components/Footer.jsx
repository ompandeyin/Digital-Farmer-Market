import React from 'react'
import { Link } from 'react-router-dom'
import { Leaf, Mail, Phone, MapPin } from 'lucide-react'

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      <div className="container mx-auto px-4 py-12">
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-white">Farm<span className="text-green-400">2</span>Home</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Connecting farmers directly with consumers for fresh, sustainable produce.
            </p>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-green-400 transition">About Us</Link></li>
              <li><Link to="/" className="hover:text-green-400 transition">How It Works</Link></li>
              <li><Link to="/" className="hover:text-green-400 transition">Careers</Link></li>
              <li><Link to="/" className="hover:text-green-400 transition">Contact</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-white mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-green-400 transition">Help Center</Link></li>
              <li><Link to="/" className="hover:text-green-400 transition">Safety</Link></li>
              <li><Link to="/" className="hover:text-green-400 transition">Terms of Service</Link></li>
              <li><Link to="/" className="hover:text-green-400 transition">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Farmers */}
          <div>
            <h4 className="font-semibold text-white mb-4">For Farmers</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-green-400 transition">Start Selling</Link></li>
              <li><Link to="/" className="hover:text-green-400 transition">Farmer Resources</Link></li>
              <li><Link to="/" className="hover:text-green-400 transition">Success Stories</Link></li>
              <li><Link to="/" className="hover:text-green-400 transition">Pricing</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm">© 2025 Farm2Home. All rights reserved.</p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-green-400 transition">Facebook</a>
              <a href="#" className="text-gray-400 hover:text-green-400 transition">Twitter</a>
              <a href="#" className="text-gray-400 hover:text-green-400 transition">Instagram</a>
              <a href="#" className="text-gray-400 hover:text-green-400 transition">LinkedIn</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer

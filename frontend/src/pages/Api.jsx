import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Api = () => {
    return (
        <div className="min-h-screen bg-white high-contrast:bg-black font-sans">
            <Navbar />
            
            <section className="pt-32 pb-24 bg-gray-50 high-contrast:bg-gray-900 min-h-[calc(100vh-80px)] relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-50/50 rounded-full blur-3xl -z-10 high-contrast:hidden"></div>

                <div className="max-w-7xl mx-auto px-4 relative z-10">
                    <div className="text-center mb-16 max-w-3xl mx-auto">
                        <h2 className="text-sm font-bold text-blue-600 mb-3 high-contrast:text-yellow-400 uppercase tracking-wider">Developers</h2>
                        <h3 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 high-contrast:text-white">Integrate Accessibility API</h3>
                        <p className="text-xl text-gray-600 leading-relaxed high-contrast:text-gray-300">
                            Add inclusive features directly into your own applications with our easy-to-use APIs. Built for seamless integration across all major stacks.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Node.js */}
                        <div className="group p-8 rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 high-contrast:bg-black high-contrast:border-gray-800 high-contrast:hover:border-yellow-400 text-left">
                            <h4 className="text-2xl font-bold mb-4 flex items-center gap-2 text-gray-900 high-contrast:text-white">
                                <span className="text-yellow-500">⚡</span> Node.js
                            </h4>
                            <pre className="bg-gray-50 border border-gray-100 p-5 rounded-2xl text-xs sm:text-sm text-gray-800 overflow-x-auto shadow-inner high-contrast:bg-gray-900 high-contrast:border-gray-700 high-contrast:text-green-400">
                                <code>{`import { EqualEd } from 'equaled-sdk';

// Initialize Voice STT
const client = new EqualEd('YOUR_API_KEY');

client.voice.startListening((text) => {
  console.log("Transcribed:", text);
});`}</code>
                            </pre>
                        </div>
                        
                        {/* Python */}
                        <div className="group p-8 rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 high-contrast:bg-black high-contrast:border-gray-800 high-contrast:hover:border-yellow-400 text-left">
                            <h4 className="text-2xl font-bold mb-4 flex items-center gap-2 text-gray-900 high-contrast:text-white">
                                <span className="text-blue-500">🐍</span> Python
                            </h4>
                            <pre className="bg-gray-50 border border-gray-100 p-5 rounded-2xl text-xs sm:text-sm text-gray-800 overflow-x-auto shadow-inner high-contrast:bg-gray-900 high-contrast:border-gray-700 high-contrast:text-blue-300">
                                <code>{`import equaled

client = equaled.Client(api_key="API_KEY")

# Generate assistive TTS
audio = client.tts.synthesize(
    text="Welcome to EqualEd",
    language="hi-IN"
)
with open("output.wav", "wb") as f:
    f.write(audio)`}</code>
                            </pre>
                        </div>

                        {/* Java */}
                        <div className="group p-8 rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 high-contrast:bg-black high-contrast:border-gray-800 high-contrast:hover:border-yellow-400 text-left">
                            <h4 className="text-2xl font-bold mb-4 flex items-center gap-2 text-gray-900 high-contrast:text-white">
                                <span className="text-red-500">☕</span> Java
                            </h4>
                            <pre className="bg-gray-50 border border-gray-100 p-5 rounded-2xl text-xs sm:text-sm text-gray-800 overflow-x-auto shadow-inner high-contrast:bg-gray-900 high-contrast:border-gray-700 high-contrast:text-orange-300">
                                <code>{`import com.equaled.api.*;

public class Main {
  public static void main(String[] args) {
    EqualEd client = new EqualEd("API_KEY");
    
    // Auto-fix contrast
    String html = client.ui()
        .enhance("<html>...</html>");
        
    System.out.println(html);
  }
}`}</code>
                            </pre>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default Api;

import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

function LegalNotice() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="container mx-auto px-4 py-12" style={{ maxWidth: '900px', color: 'var(--text-color, #e0e0e0)' }}>
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-4" style={{ fontFamily: 'Cinzel, serif', color: 'var(--color-red, #711a19)' }}>
          LEGAL NOTICE
        </h1>
        <div style={{ height: '3px', width: '60px', backgroundColor: 'var(--color-red, #711a19)', margin: '0 auto' }}></div>
      </div>
      
      <div className="card-panel p-8 rounded-sm shadow-xl" style={{ backgroundColor: 'var(--panel-bg, #2a2a2a)', border: '1px solid var(--border-color, #444)', borderTop: '5px solid var(--color-red, #711a19)' }}>
        
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 pb-2" style={{ color: 'var(--color-red, #711a19)', borderBottom: '1px solid #444' }}>
            1. Overview
          </h2>
          <p className="mb-4 leading-relaxed text-sm">
            This website ("DND Companion") is an unofficial fan-made project created strictly for educational purposes and private use. It is designed to assist players and Dungeon Masters in managing their Dungeons & Dragons tabletop role-playing games. This application is completely free to use, open-source, and operates without any commercial or profit-seeking intent.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 pb-2" style={{ color: 'var(--color-red, #711a19)', borderBottom: '1px solid #444' }}>
            2. Wizards of the Coast Fan Content Policy
          </h2>
          <div className="p-4 rounded mb-4" style={{ backgroundColor: 'rgba(113, 26, 25, 0.1)', borderLeft: '4px solid var(--color-red, #711a19)' }}>
            <p className="font-semibold italic text-sm" style={{ color: '#ccc' }}>
              "DND Companion is unofficial Fan Content permitted under the Fan Content Policy. Not approved/endorsed by Wizards. Portions of the materials used are property of Wizards of the Coast. ©Wizards of the Coast LLC."
            </p>
          </div>
          <p className="mb-4 leading-relaxed text-sm">
            This project is published under the terms of the Wizards of the Coast Fan Content Policy. It is not officially endorsed, sponsored, or affiliated with Wizards of the Coast. Any artwork, lore, and intellectual property remain the exclusive property of Wizards of the Coast LLC.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 pb-2" style={{ color: 'var(--color-red, #711a19)', borderBottom: '1px solid #444' }}>
            3. Creative Commons (CC-BY-4.0) & SRD 5.1
          </h2>
          <div className="p-4 rounded mb-4" style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
            <p className="italic text-sm text-gray-400">
              This work includes material taken from the System Reference Document 5.1 (“SRD 5.1”) by Wizards of the Coast LLC and available at <a href="https://dnd.wizards.com/resources/systems-reference-document" target="_blank" rel="noreferrer" className="hover:underline" style={{ color: 'var(--color-red, #711a19)' }}>https://dnd.wizards.com/resources/systems-reference-document</a>. The SRD 5.1 is licensed under the Creative Commons Attribution 4.0 International License available at <a href="https://creativecommons.org/licenses/by/4.0/legalcode" target="_blank" rel="noreferrer" className="hover:underline" style={{ color: 'var(--color-red, #711a19)' }}>https://creativecommons.org/licenses/by/4.0/legalcode</a>.
            </p>
          </div>
          <p className="mb-4 leading-relaxed text-sm">
            All game mechanics, rules, classes, spells, and items provided within this application are strictly sourced from the official Systems Reference Document (SRD 5.1), which Wizards of the Coast released under the Creative Commons Attribution 4.0 International License (CC-BY-4.0).
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 pb-2" style={{ color: 'var(--color-red, #711a19)', borderBottom: '1px solid #444' }}>
            4. Privacy Policy & Data Usage
          </h2>
          <p className="mb-4 leading-relaxed text-sm">
            Respecting user privacy is a core principle of this project. 
            <ul className="list-disc pl-6 mt-2">
              <li className="mb-1"><strong>Local Storage:</strong> Character data, preferences, and session tokens are stored locally on your device or a private self-hosted database instance.</li>
              <li className="mb-1"><strong>No Tracking:</strong> We do not use third-party tracking scripts, analytics, or advertising cookies.</li>
              <li className="mb-1"><strong>No Data Sale:</strong> Your personal information and generated content will never be sold, distributed, or used for targeted advertising.</li>
            </ul>
          </p>
        </section>

        <section className="mb-2">
          <h2 className="text-2xl font-bold mb-4 pb-2" style={{ color: 'var(--color-red, #711a19)', borderBottom: '1px solid #444' }}>
            5. Disclaimer of Warranties
          </h2>
          <p className="leading-relaxed text-sm uppercase text-gray-400 text-xs text-justify">
            THIS SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
          </p>
        </section>

        <section className="mb-2 mt-8">
          <h2 className="text-2xl font-bold mb-4 pb-2" style={{ color: 'var(--color-red, #711a19)', borderBottom: '1px solid #444' }}>
            6. Contact & Support
          </h2>
          <p className="mb-4 leading-relaxed text-sm">
            For any inquiries, technical issues, DMCA takedown requests, or copyright concerns, please contact the developer through our official channels:
          </p>
          <ul className="list-disc pl-6 mt-2 text-sm">
            <li className="mb-2">
              <strong>Email:</strong>{' '}
              <a href="mailto:Phitchayut2798@gmail.com" className="hover:underline font-semibold" style={{ color: 'var(--color-red, #711a19)' }}>
                Phitchayut2798@gmail.com
              </a>
            </li>
            <li className="mb-2">
              <strong>GitHub:</strong>{' '}
              <a href="https://github.com/Exises" target="_blank" rel="noreferrer" className="hover:underline font-semibold" style={{ color: 'var(--color-red, #711a19)' }}>
                @Exises (Phitchayut)
              </a>
            </li>
            <li className="mb-2">
              <strong>Feedback Form:</strong>{' '}
              <Link to="/feedback" className="hover:underline font-semibold" style={{ color: 'var(--color-red, #711a19)' }}>
                Submit Feedback via Website
              </Link>
            </li>
          </ul>
        </section>
      </div>

      <div className="text-center mt-10">
        <button 
          onClick={() => window.history.back()} 
          className="px-8 py-3 font-bold transition-all hover:opacity-90 uppercase tracking-widest text-sm shadow-md" 
          style={{ 
            backgroundColor: 'var(--color-red, #711a19)', 
            color: '#fff',
            border: 'none',
            borderRadius: '2px',
            cursor: 'pointer'
          }}
        >
          Return
        </button>
      </div>
    </div>
  );
}

export default LegalNotice;

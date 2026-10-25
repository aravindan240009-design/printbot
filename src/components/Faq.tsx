import React from 'react';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    id: 'what-is-print-bot',
    question: 'What is Print Bot and who is it designed for?',
    answer: 'Print Bot is a subscription operating system for print shops, copy centers, and photocopy/Xerox businesses. It enables walk-in customers to upload documents from their phones via QR code without downloading an app, while shop staff manage queues and silent background printing through an authorized Windows application.',
  },
  {
    id: 'os-support',
    question: 'Which operating systems and printer types are supported?',
    answer: 'The Print Bot desktop application and print service run on 64-bit Windows 10 and Windows 11. It discovers and interfaces with all standard Windows-supported printers, including USB laser printers, color inkjets, duplex office printers, and multi-function copiers via Win32 Spooler APIs.',
  },
  {
    id: 'no-customer-app',
    question: 'How do customers upload files without an app?',
    answer: 'Customers scan a unique QR code displayed at the shop counter using their smartphone camera. A progressive web application opens instantly in their mobile browser, allowing them to select PDF, image, or document files, customize print settings, view page previews, and pay securely.',
  },
  {
    id: 'installer-availability',
    question: 'Is the Windows installer available for public download yet?',
    answer: 'Print Bot is currently undergoing controlled commercial pilot testing across authorized print shops (Phase 6 of our development plan). The Windows installer will be made available through the download button on this page once the public release channel is activated. Operators participating in the closed pilot receive direct provisioning.',
  },
  {
    id: 'document-privacy',
    question: 'How does customer document privacy and deletion work?',
    answer: 'Customer files are held ephemerally with short-lived tokens and isolated per shop. Once a job is printed and collected, or if the customer selects Delete Now, original source files and preview artifacts are permanently purged from cloud storage. Local temporary spool caches are wiped by the Windows service journal.',
  },
  {
    id: 'printer-failure',
    question: 'What happens if a printer runs out of paper or goes offline?',
    answer: 'If a printer goes offline prior to payment, the system redirects to another compatible printer or offers a timed pickup hold. If an interruption occurs after submission, the local SQLite journal records the ambiguous state as COMPLETION_UNCERTAIN to prevent accidental duplicate printing, prompting the operator for manual verification.',
  },
  {
    id: 'printer-counts',
    question: 'Can we connect multiple printers to one shop computer?',
    answer: 'Yes. Print Bot includes unlimited printer discovery per shop subscription. You can connect and manage multiple USB laser printers, color inkjets, and multi-function copiers on your counter computer without paying per-device upgrade tiers.',
  },
];

export const Faq: React.FC = () => {
  return (
    <section id="faq" className="section" aria-labelledby="faq-heading">
      <div className="wrap">
        <div className="faq-two-part-row">
          <div className="faq-sidebar" data-reveal>
            <h2 id="faq-heading" className="head">
              Answers about Print Bot.
            </h2>
            <p className="small muted">
              Verified details from the technical architecture specification and pilot testing baseline.
            </p>
          </div>

          <div className="faq-stack">
            {FAQS.map((faq) => (
              <details key={faq.id} className="faq-tile" name="print-bot-faq" data-reveal>
                <summary className="faq-summary">
                  <span>{faq.question}</span>
                  <span className="faq-toggle-mark" aria-hidden="true" />
                </summary>
                <div className="faq-content">
                  <p>{faq.answer}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

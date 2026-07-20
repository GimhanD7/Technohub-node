import sys

with open('src/app/dashboard/admin/sms-logs/page.js', 'r') as f:
    code = f.read()

# Add states for modal
modal_states = '''  const [showModal, setShowModal] = useState(false);
  const [bulkMessage, setBulkMessage] = useState("");
  const [bulkAudience, setBulkAudience] = useState("all_users");
  const [isSending, setIsSending] = useState(false);
'''

code = code.replace('  const [searchTerm, setSearchTerm] = useState("");\n', '  const [searchTerm, setSearchTerm] = useState("");\n' + modal_states)

# Add handleBulkSend function
handle_bulk = '''
  const handleBulkSend = async () => {
    if (!bulkMessage.trim()) {
      toast.error("Please enter a message to send.");
      return;
    }
    
    setIsSending(true);
    try {
      const res = await fetch(`${API_BASE_URL}/sms/send_bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetAudience: bulkAudience,
          message: bulkMessage
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setShowModal(false);
        setBulkMessage("");
        fetchLogs();
      } else {
        toast.error(data.message || "Failed to send bulk SMS.");
      }
    } catch (error) {
      toast.error("An error occurred while sending SMS.");
    } finally {
      setIsSending(false);
    }
  };
'''

code = code.replace('  useEffect(() => {\n', handle_bulk + '\n  useEffect(() => {\n')

# Add Send Bulk SMS button
buttons_html = '''        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg shadow-sm hover:bg-primary/90 text-[13px] font-medium transition-colors flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            Send Bulk SMS
          </button>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="px-4 py-2 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800 text-slate-600 dark:text-white rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-slate-800/50 text-[13px] font-medium transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>'''

old_button = '''        <button
          onClick={fetchLogs}
          disabled={loading}
          className="px-4 py-2 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800 text-slate-600 dark:text-white rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-slate-800/50 text-[13px] font-medium transition-colors flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>'''

code = code.replace(old_button, buttons_html)

# Add Modal JSX at the end before closing div
modal_jsx = '''
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1e293b] rounded-xl w-full max-w-lg shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Send Bulk SMS
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Target Audience</label>
                <select 
                  value={bulkAudience}
                  onChange={(e) => setBulkAudience(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm focus:outline-none focus:border-primary dark:bg-[#0f172a] dark:text-white"
                >
                  <option value="all_users">All Users</option>
                  <option value="students">Students Only</option>
                  <option value="teachers">Teachers Only</option>
                  <option value="admins">Admins Only</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Message Content</label>
                <textarea
                  value={bulkMessage}
                  onChange={(e) => setBulkMessage(e.target.value)}
                  placeholder="Enter the SMS message you want to broadcast..."
                  rows={4}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm focus:outline-none focus:border-primary dark:bg-[#0f172a] dark:text-white resize-none"
                />
                <p className="text-[11px] text-slate-500 mt-1 flex justify-between">
                  <span>{bulkMessage.length} characters</span>
                  <span>{Math.ceil(bulkMessage.length / 160) || 1} SMS Message(s) per user</span>
                </p>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkSend}
                disabled={isSending || !bulkMessage.trim()}
                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Sending...
                  </>
                ) : (
                  <>Send Broadcast</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
'''

code = code.replace('    </div>\n  );\n}\n', modal_jsx + '    </div>\n  );\n}\n')

with open('src/app/dashboard/admin/sms-logs/page.js', 'w') as f:
    f.write(code)

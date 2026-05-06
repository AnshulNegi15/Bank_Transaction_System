const { useState, useEffect, createContext, useContext } = React;

const AuthContext = createContext(null);
const API_URL = "http://localhost:5000/api";

function App() {
    const [token, setToken] = useState(localStorage.getItem("token"));
    
    const login = (newToken) => {
        localStorage.setItem("token", newToken);
        setToken(newToken);
    };

    const logout = () => {
        localStorage.removeItem("token");
        setToken(null);
    };

    return (
        <AuthContext.Provider value={{ token, login, logout }}>
            <div className="container">
                {token ? <Dashboard /> : <AuthScreen />}
            </div>
        </AuthContext.Provider>
    );
}

function AuthScreen() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const { login } = useContext(AuthContext);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        const endpoint = isLogin ? "/auth/login" : "/auth/register";
        const body = isLogin ? { email, password } : { email, password, name };

        try {
            const res = await fetch(`${API_URL}${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Authentication failed");
            login(data.token);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="card">
            <h1>{isLogin ? "Sign In" : "Create Account"}</h1>
            {error && <div className="error">{error}</div>}
            <form onSubmit={handleSubmit}>
                {!isLogin && (
                    <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required />
                )}
                <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
                <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
                <button type="submit">{isLogin ? "Sign In" : "Register"}</button>
            </form>
            <button className="secondary-btn" onClick={() => setIsLogin(!isLogin)}>
                {isLogin ? "Need an account? Register" : "Already have an account? Sign In"}
            </button>
        </div>
    );
}

function Dashboard() {
    const { token, logout } = useContext(AuthContext);
    const [accounts, setAccounts] = useState([]);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [amount, setAmount] = useState("");
    const [toAccount, setToAccount] = useState("");
    const [fromAccount, setFromAccount] = useState("");

    const fetchAccounts = async () => {
        try {
            const res = await fetch(`${API_URL}/accounts`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setAccounts(data.accounts);
                if (data.accounts.length > 0) setFromAccount(data.accounts[0].account.id);
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchAccounts();
    }, []);

    const createAccount = async () => {
        try {
            await fetch(`${API_URL}/accounts`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });
            fetchAccounts();
        } catch (err) {
            console.error(err);
        }
    };

    const handleTransaction = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        
        try {
            const res = await fetch(`${API_URL}/transaction`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    fromAccount,
                    toAccount,
                    amount: parseFloat(amount),
                    idempotencyKey: crypto.randomUUID()
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Transaction failed");
            setSuccess("Transaction successful!");
            setAmount("");
            setToAccount("");
            fetchAccounts();
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div>
            <div className="nav">
                <h1>Dashboard</h1>
                <button className="secondary-btn" onClick={logout} style={{width: 'auto'}}>Sign Out</button>
            </div>
            
            <div className="card">
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                    <h2>My Accounts</h2>
                    <button onClick={createAccount} style={{width: 'auto'}}>+ New Account</button>
                </div>
                {accounts.map(acc => (
                    <div key={acc.account.id} className="account-item">
                        <div>
                            <div style={{fontSize: '14px', color: 'var(--text-secondary)'}}>ID: {acc.account.id}</div>
                            <div style={{fontSize: '14px'}}>{acc.account.currency} - {acc.account.status}</div>
                        </div>
                        <div className="balance">${acc.balance.toFixed(2)}</div>
                    </div>
                ))}
                {accounts.length === 0 && <p>No accounts found. Create one to get started.</p>}
            </div>

            <div className="card">
                <h2>Transfer Money</h2>
                {error && <div className="error">{error}</div>}
                {success && <div className="success">{success}</div>}
                <form onSubmit={handleTransaction}>
                    <select 
                        style={{width: '100%', padding: '12px', margin: '8px 0 16px', borderRadius: '12px', border: '1px solid var(--border)'}}
                        value={fromAccount} 
                        onChange={e => setFromAccount(e.target.value)} 
                        required
                    >
                        {accounts.map(acc => (
                            <option key={acc.account.id} value={acc.account.id}>From: {acc.account.id} (Bal: ${acc.balance})</option>
                        ))}
                    </select>
                    <input type="text" placeholder="To Account ID" value={toAccount} onChange={e => setToAccount(e.target.value)} required />
                    <input type="number" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} required min="0.01" step="0.01" />
                    <button type="submit" disabled={accounts.length === 0}>Send Money</button>
                </form>
            </div>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useLocalStorageState from '../hooks/useLocalStorageState';

function CompendiumHub() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useLocalStorageState('compendiumHub_searchQuery', '');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchQuery.trim().length > 1) {
                setIsSearching(true);
                try {
                    const response = await fetch(`http://localhost:5000/api?q=${encodeURIComponent(searchQuery)}`);
                    const data = await response.json();
                    setSearchResults(Array.isArray(data) ? data : []);
                } catch (error) {
                    console.error("Search error:", error);
                    setSearchResults([]);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
    };

    const navigateToCategory = (category) => {
        navigate(`/compendium/${category}`);
    };

    const handleResultClick = (result) => {
        navigate(`/compendium/${result.category}?id=${result.id}`);
    };

    return (
        <div className="flex-1 flex flex-col items-center pt-16 px-4 w-full">
            <h2 className="font-serif text-3xl font-bold text-gray-800 mb-2 tracking-widest text-center w-full">COMPENDIUM</h2>
            <p className="text-gray-500 text-sm mb-6 font-light text-center w-full">คลังข้อมูลกฎ 5th Edition (2024)</p>
            
            {/* Live Search Bar */}
            <div className="w-full max-w-2xl relative mb-16 z-30 mx-auto">
                <i className="fa-solid fa-magnifying-glass absolute left-4 top-4 text-red-800 z-10"></i>
                <input 
                    type="text" 
                    value={searchQuery}
                    onChange={handleSearch}
                    placeholder="ค้นหาอาชีพ, ภูมิหลัง, เผ่าพันธุ์ หรือไอเทม..." 
                    className="w-full pl-12 pr-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:border-red-800 focus:ring-1 focus:ring-red-800 shadow-sm relative z-10"
                    style={{ paddingLeft: '48px' }}
                />

                {/* Search Results Dropdown */}
                {(searchResults.length > 0 || isSearching) && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 mt-1 rounded-md shadow-xl overflow-hidden z-20 animate-fade-in">
                        {isSearching ? (
                            <div className="p-4 text-center text-gray-500">กำลังค้นหา...</div>
                        ) : (
                            searchResults.map((result, index) => (
                                <div 
                                    key={index} 
                                    onClick={() => handleResultClick(result)}
                                    className="px-4 py-3 hover:bg-red-50 cursor-pointer flex justify-between items-center border-b border-gray-100 last:border-0 transition-colors"
                                >
                                    <div className="flex flex-col">
                                        <span className="text-gray-800 font-medium">{result.name}</span>
                                        <span className="text-xs text-gray-400 capitalize">{result.category}</span>
                                    </div>
                                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded font-bold">{result.type}</span>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            <div className="w-full max-w-4xl mx-auto">
                <div className="text-center mb-8 border-b-2 border-red-800 inline-block pb-1 mx-auto relative left-1/2 -translate-x-1/2">
                    <h3 className="font-serif text-xl tracking-wider uppercase text-gray-800">Browse by Category</h3>
                </div>

                <div className="card-grid">
                    {/* Category: Classes */}
                    <div 
                        onClick={() => navigateToCategory('classes')} 
                        className="card"
                    >
                        <div className="card-icon">
                            <i className="fa-solid fa-user-shield"></i>
                        </div>
                        <h4 className="card-title">Classes</h4>
                        <p className="text-sm text-gray-500">อาชีพและความสามารถ</p>
                        <div className="card-link">
                            สำรวจอาชีพ <i className="fa-solid fa-arrow-right"></i>
                        </div>
                    </div>

                    {/* Category: Backgrounds */}
                    <div 
                        onClick={() => navigateToCategory('backgrounds')} 
                        className="card"
                    >
                        <div className="card-icon">
                            <i className="fa-solid fa-address-card"></i>
                        </div>
                        <h4 className="card-title">Backgrounds</h4>
                        <p className="text-sm text-gray-500">ภูมิหลังตัวละคร</p>
                        <div className="card-link">
                            ดูภูมิหลัง <i className="fa-solid fa-arrow-right"></i>
                        </div>
                    </div>

                    {/* Category: Species */}
                    <div 
                        onClick={() => navigateToCategory('species')} 
                        className="card"
                    >
                        <div className="card-icon">
                            <i className="fa-brands fa-drupal"></i>
                        </div>
                        <h4 className="card-title">Species</h4>
                        <p className="text-sm text-gray-500">เผ่าพันธุ์</p>
                        <div className="card-link">
                            เลือกเผ่าพันธุ์ <i className="fa-solid fa-arrow-right"></i>
                        </div>
                    </div>

                    {/* Category: Feats */}
                    <div 
                        onClick={() => navigateToCategory('feats')} 
                        className="card"
                    >
                        <div className="card-icon">
                            <i className="fa-solid fa-star"></i>
                        </div>
                        <h4 className="card-title">Feats</h4>
                        <p className="text-sm text-gray-500">ความสามารถพิเศษ</p>
                        <div className="card-link">
                            อ่านความสามารถ <i className="fa-solid fa-arrow-right"></i>
                        </div>
                    </div>

                    {/* Category: Items */}
                    <div 
                        onClick={() => navigateToCategory('items')} 
                        className="card"
                    >
                        <div className="card-icon">
                            <i className="fa-solid fa-shield-halved"></i>
                        </div>
                        <h4 className="card-title">Items</h4>
                        <p className="text-sm text-gray-500">อุปกรณ์และไอเทม</p>
                        <div className="card-link">
                            ค้นหาไอเทม <i className="fa-solid fa-arrow-right"></i>
                        </div>
                    </div>

                    {/* Category: Spells */}
                    <div 
                        onClick={() => navigateToCategory('spells')} 
                        className="card"
                    >
                        <div className="card-icon">
                            <i className="fa-solid fa-wand-sparkles"></i>
                        </div>
                        <h4 className="card-title">Spells</h4>
                        <p className="text-sm text-gray-500">คาถาและเวทมนตร์</p>
                        <div className="card-link">
                            ร่ายเวทมนตร์ <i className="fa-solid fa-arrow-right"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CompendiumHub;


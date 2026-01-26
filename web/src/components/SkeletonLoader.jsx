const SkeletonLoader = ({ rows = 10, columns = 30 }) => {
    return (
        <div className="flex flex-col overflow-hidden">
            {/* Header Row */}
            <div className="flex sticky left-0 z-10 bg-stone-900">
                <div className="w-48 h-10 m-1 bg-stone-800/50 rounded animate-pulse" />
                {Array(columns).fill(0).map((_, colIdx) => (
                    <div
                        key={colIdx}
                        className="w-16 h-10 m-1 bg-stone-800/50 rounded animate-pulse"
                        style={{
                            animationDelay: `${colIdx * 0.02}s`,
                            animationDuration: '1.5s'
                        }}
                    />
                ))}
            </div>

            {/* Data Rows */}
            {Array(rows).fill(0).map((_, rowIdx) => (
                <div key={rowIdx} className="flex">
                    {/* Row Header */}
                    <div className="w-48 h-10 m-1 bg-stone-800/50 rounded animate-pulse"
                        style={{
                            animationDelay: `${rowIdx * 0.05}s`,
                            animationDuration: '1.5s'
                        }}
                    />

                    {/* Data Cells */}
                    {Array(columns).fill(0).map((_, colIdx) => (
                        <div
                            key={colIdx}
                            className="w-16 h-10 m-1 bg-stone-800/50 rounded animate-pulse"
                            style={{
                                animationDelay: `${(rowIdx + colIdx) * 0.02}s`,
                                animationDuration: '1.5s'
                            }}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
};

export default SkeletonLoader;

import { rate, rating, ordinal } from 'https://cdn.jsdelivr.net/npm/openskill@4.1.1/+esm';

self.onmessage = function(e) {
    const { id, type, data } = e.data;
    
    if (type === 'RATE_MATCH') {
        const { currentMatchup, currentRatings, ranksForOpenskill } = data;
        
        const teams = currentMatchup.map(fileId => {
            const r = currentRatings[fileId] || { mu: 25.0, sigma: 8.333 };
            return [ rating({ mu: r.mu, sigma: r.sigma }) ];
        });

        const newTeams = rate(teams, { rank: ranksForOpenskill });
        
        const results = {};
        currentMatchup.forEach((fileId, i) => {
            results[fileId] = {
                mu: newTeams[i][0].mu,
                sigma: newTeams[i][0].sigma
            };
        });

        self.postMessage({ id, type: 'RATE_RESULT', results });
    }
};

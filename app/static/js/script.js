(function () {
    'use strict';

    let chart = null;

    async function updatePriceAndChart() {
        const elements = {
            priceDisplay: document.getElementById('price-display'),
            fearGreedIndex: document.getElementById('fear-greed-index'),
            transactionFee: document.getElementById('transaction-fee'),
            priceVariation: document.getElementById('price-variation'),
            btcDominance: document.getElementById('btc-dominance')
        };

        // Adicionar classe de loading
        Object.values(elements).forEach(el => el.classList.add('loading'));

        try {
            // Atualizar preço
            const priceResponse = await fetch('/get_price');
            const priceData = await priceResponse.json();
            console.log('Preço recebido:', priceData.price);
            elements.priceDisplay.textContent = priceData.price;

            // Atualizar gráfico e variação
            const chartResponse = await fetch('/get_price_history');
            const chartData = await chartResponse.json();
            console.log('Dados do gráfico recebidos:', chartData.prices);
            if (chartData.prices && chartData.prices.length > 0) {
                updateChart(chartData.prices, priceData.price, chartData.prices[0]);
                updatePriceVariation(priceData.price, chartData.prices[0], elements.priceVariation);
            } else {
                console.error('Nenhum dado de preços disponível para o gráfico!');
            }

            // Atualizar índice de medo e ganância
            try {
                const fearGreedResponse = await fetch('https://api.alternative.me/fng/?limit=1');
                if (!fearGreedResponse.ok) {
                    throw new Error(`Erro na API Fear and Greed: ${fearGreedResponse.status}`);
                }
                const fearGreedData = await fearGreedResponse.json();
                if (fearGreedData && fearGreedData.data && fearGreedData.data.length > 0) {
                    const fearGreedIndex = parseInt(fearGreedData.data[0].value);
                    elements.fearGreedIndex.textContent = fearGreedIndex;
                    let color;
                    if (fearGreedIndex <= 25) color = '#ff0000';
                    else if (fearGreedIndex <= 50) color = '#ff8000';
                    else if (fearGreedIndex <= 75) color = '#00cc00';
                    else color = '#008000';
                    elements.fearGreedIndex.style.color = color;
                    console.log('Índice de Medo e Ganância:', fearGreedIndex, 'Cor:', color);
                } else {
                    console.error('Dados do Fear and Greed Index inválidos:', fearGreedData);
                    elements.fearGreedIndex.textContent = 'Error';
                }
            } catch (apiError) {
                console.error('Erro ao buscar Fear and Greed Index:', apiError);
                elements.fearGreedIndex.textContent = 'Error';
            }

            // Atualizar dominância do Bitcoin
            try {
                const dominanceResponse = await fetch('https://api.coingecko.com/api/v3/global');
                if (!dominanceResponse.ok) {
                    throw new Error(`Erro na API CoinGecko: ${dominanceResponse.status}`);
                }
                const dominanceData = await dominanceResponse.json();
                const btcDominance = dominanceData.data.market_cap_percentage.btc.toFixed(2);
                elements.btcDominance.textContent = `${btcDominance}%`;
                console.log('Dominância do Bitcoin:', btcDominance);
            } catch (apiError) {
                console.error('Erro ao buscar dominância do Bitcoin:', apiError);
                elements.btcDominance.textContent = 'Error';
            }
        } catch (error) {
            console.error('Erro ao atualizar preço, gráfico ou índices:', error);
            elements.priceDisplay.textContent = 'Erro';
        } finally {
            // Remover classe de loading após todas as operações
            Object.values(elements).forEach(el => el.classList.remove('loading'));
        }
    }

    async function updateTransactionFee() {
        const transactionFee = document.getElementById('transaction-fee');
        transactionFee.classList.add('loading');

        try {
            const feeResponse = await fetch('/get_transaction_fee');
            const feeData = await feeResponse.json();
            console.log('Transaction Fee Data:', feeData);
            transactionFee.textContent = `${feeData.fee} sat/vB`;
        } catch (error) {
            console.error('Erro ao atualizar o transaction fee:', error);
            transactionFee.textContent = 'Erro';
        } finally {
            transactionFee.classList.remove('loading');
        }
    }

    function updatePriceVariation(currentPrice, price24hAgo, element) {
        const variation = ((currentPrice - price24hAgo) / price24hAgo) * 100;
        const variationText = (variation >= 0 ? '+' : '') + variation.toFixed(2) + '%';
        element.textContent = variationText;
        console.log('Variação percentual:', variationText);
    }

    function updateChart(prices, currentPrice, price24hAgo) {
        console.log('Iniciando renderização do gráfico com', prices.length, 'pontos:', prices);
        const canvas = document.getElementById('price-chart');
        if (!canvas) {
            console.error('Canvas não encontrado!');
            return;
        }
        console.log('Canvas encontrado, largura:', canvas.width, 'altura:', canvas.height);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('Contexto do canvas não encontrado!');
            return;
        }
        if (chart) {
            console.log('Destruindo gráfico anterior...');
            chart.destroy();
        }
        try {
            const variation = ((currentPrice - price24hAgo) / price24hAgo) * 100;
            const borderColor = variation > 0 ? 'rgba(0, 255, 0, 1)' : 'rgba(255, 0, 0, 1)';

            chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: prices.map((_, i) => i),
                    datasets: [{
                        label: 'Bitcoin Price (24h)',
                        data: prices,
                        borderColor: borderColor,
                        borderWidth: 2,
                        pointRadius: 0,
                        fill: false
                    }]
                },
                options: {
                    scales: {
                        x: { display: false },
                        y: {
                            display: false,
                            suggestedMin: Math.min(...prices),
                            suggestedMax: Math.max(...prices)
                        }
                    },
                    plugins: {
                        legend: { display: false }
                    },
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
            console.log('Gráfico criado com sucesso, cor:', borderColor);
        } catch (chartError) {
            console.error('Erro ao criar o gráfico:', chartError);
        }
    }

    // Inicialização e Intervalos
    setInterval(updatePriceAndChart, 120000); // Atualiza a cada 2 minutos
    setInterval(updateTransactionFee, 10000); // Atualiza a cada 10 segundos
    updatePriceAndChart();
    updateTransactionFee();
})();
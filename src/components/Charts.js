import { useSelector, useDispatch } from 'react-redux';
import Table from 'react-bootstrap/Table';
import Chart from 'react-apexcharts';
import { ethers } from 'ethers';
import { options, series } from './Charts.config';
import { chartSelector } from '../store/selectors';
import { useEffect } from 'react';

import Loading from './Loading';

import {
    loadAllSwaps
} from '../store/interactions';

const Charts = () => {
    const provider = useSelector(state => state.provider.connection);
    const tokens = useSelector(state => state.tokens.contracts);
    const symbols = useSelector(state => state.tokens.symbols);
    const amm = useSelector(state => state.amm.contract);
    const chart = useSelector(chartSelector);
    const dispatch = useDispatch();

    useEffect(() => {
        if (provider && amm) {
            loadAllSwaps(provider, amm, dispatch);
        }
    }, [provider, amm, dispatch]);

    const columns = [
        'Transaction Hash',
        'Token Give',
        'Amount Give',
        'Token Get',
        'Amount Get',
        'User',
        'Time'
    ];

    return (
        <div>
            {provider && amm ? (
                <div>
                    <Chart
                        options={options}
                        series={chart ? chart.series : series}
                        type="line"
                        width="100%"
                        height="100%"
                    />
                    <hr />
                    <Table striped bordered hover>
                        <thead>
                            <tr>
                                {columns.map((column, index) => (
                                    <th key={index}>{column}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {chart.swaps && chart.swaps.map((swap, index) => (
                                <tr key={index}>
                                    <td>{swap.hash.slice(0, 5) + '...' + swap.hash.slice(61, 66)}</td>
                                    <td>{swap.args.tokenGive === tokens[0].address ? symbols[0] : symbols[1]}</td>
                                    <td>{ethers.utils.formatUnits(swap.args.tokenGiveAmount.toString(), 'ether')}</td>
                                    <td>{swap.args.tokenGet === tokens[0].address ? symbols[0] : symbols[1]}</td>
                                    <td>{ethers.utils.formatUnits(swap.args.tokenGetAmount.toString(), 'ether')}</td>
                                    <td>{swap.args.user.slice(0, 5) + '...' + swap.args.user.slice(38, 42)}</td>
                                    <td>{
                                        new Date(Number(swap.args.timestamp.toString() + '000'))
                                            .toLocaleDateString(
                                                undefined,
                                                {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric' ,
                                                    hour: 'numeric',
                                                    minute: 'numeric'
                                                }
                                            )
                                        }</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>
            ) : (
                <Loading />
            )}
        </div>
    );
  }

  export default Charts;

import { Anchor } from 'ual-anchor'
import { Wax } from '@eosdacio/ual-wax';
import { UALProvider, withUAL } from 'ual-reactjs-renderer'

import { JsonRpc } from 'eosjs'
import * as React from 'react'
import ReactDOM from 'react-dom'

const demoTransaction = {
  actions: [{
    account: 'eosio.token',
    name: 'transfer',
    authorization: [{
      actor: '', // use account that was logged in
      permission: 'active',
    }],
    data: {
      from: '', // use account that was logged in
      to: 'example',
      quantity: '1.0000 EOS',
      memo: 'UAL rocks!',
    },
  }],
}

interface ExampleEnv {
  CHAIN_ID: string,
  RPC_PROTOCOL: string,
  RPC_HOST: string,
  RPC_PORT: string
}

interface TransactionProps {
  ual: any
}

interface TransactionState {
  activeUser: any
  accountName: string
  accountBalance: any
  rpc: JsonRpc
}

declare const EXAMPLE_ENV: ExampleEnv

const exampleNet = {
  chainId: EXAMPLE_ENV.CHAIN_ID,
  rpcEndpoints: [{
    protocol: EXAMPLE_ENV.RPC_PROTOCOL,
    host: EXAMPLE_ENV.RPC_HOST,
    port: Number(EXAMPLE_ENV.RPC_PORT),
  }]
}


const wax_chain = {
  chainId: '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4',
  rpcEndpoints: [{
    protocol: 'https',
    host: 'wax.greymass.com',
    port: 443,
  }]
}

const appName = 'BrokenWrld';


const defaultState = {
  activeUser: null,
  accountName: '',
  accountBalance: null,
}

class TransactionApp extends React.Component<TransactionProps, TransactionState> {
  static displayName = 'TransactionApp'

  constructor(props: TransactionProps) {
    super(props)
    this.state = {
      ...defaultState,
		rpc: new JsonRpc(`${EXAMPLE_ENV.RPC_PROTOCOL}://${EXAMPLE_ENV.RPC_HOST}:${EXAMPLE_ENV.RPC_PORT}`)
    }
    this.updateAccountBalance = this.updateAccountBalance.bind(this)
    this.updateAccountName = this.updateAccountName.bind(this)
    this.renderTransferButton = this.renderTransferButton.bind(this)
    this.transfer = this.transfer.bind(this)
    this.renderModalButton = this.renderModalButton.bind(this)
  }

  public componentDidUpdate() {
    const { ual: { activeUser } } = this.props
    if (activeUser && !this.state.activeUser) {
      this.setState({ activeUser }, this.updateAccountName)
    } else if (!activeUser && this.state.activeUser) {
      this.setState(defaultState)
    }
  }

  public async updateAccountName(): Promise<void>   {
    try {
      const accountName = await this.state.activeUser.getAccountName()
      this.setState({ accountName }, this.updateAccountBalance)
    } catch (e) {
      console.warn(e)
    }
  }

  public async updateAccountBalance(): Promise<void> {
    try {
      const account = await this.state.rpc.get_account(this.state.accountName)
      const accountBalance = account.core_liquid_balance
      this.setState({ accountBalance })
    } catch (e) {
      console.warn(e)
    }
  }

  public async transfer() {
    const { accountName, activeUser } = this.state
    demoTransaction.actions[0].authorization[0].actor = accountName
    demoTransaction.actions[0].data.from = accountName
    try {
      await activeUser.signTransaction(demoTransaction, { broadcast: true })
      await this.updateAccountBalance()
    } catch (error) {
      console.warn(error)
    }
  }

  public renderModalButton() {
    return (
	  <button class="btn header__btn" onClick={this.props.ual.showModal} >Login</button>
    )
  }

  public renderTransferButton() {
    return (
      <p className='ual-btn-wrapper'>
        <span className='ual-generic-button blue' onClick={this.transfer}>
          {'Transfer 1 eos to example'}
        </span>
      </p>
    )
  }

  public renderLogoutBtn = () => {
    const { ual: { activeUser, activeAuthenticator, logout } } = this.props
    if (!!activeUser && !!activeAuthenticator) {
      return (
		<button class="btn header__btn" onClick={logout} >Logout</button>
      )
    }
  }

  public render() {
    const { ual: { activeUser } } = this.props
    const { accountBalance, accountName } = this.state
    const modalButton = !activeUser && this.renderModalButton()
    const loggedIn = accountName ? `${accountName}      ` : ''
    const myBalance = accountBalance ? `Balance: ${accountBalance}` : ''
    const transferBtn = accountBalance && this.renderTransferButton()
    return (
	<div >
        {modalButton}
        {loggedIn}
        {this.renderLogoutBtn()}
	</div>
    )
  }
}

const TestAppConsumer = withUAL(TransactionApp)

TestAppConsumer.displayName = appName

const anchor = new Anchor([wax_chain], { appName: appName })
const wax = new Wax([wax_chain], { appName: appName })


ReactDOM.render(
  <UALProvider chains={[wax_chain]} authenticators={[wax, anchor]} appName={appName}>
    <TestAppConsumer />
  </UALProvider>,
  document.getElementById('ual-app') as HTMLElement,
)

import Header from '../shared/header/header.view'
import useTxOverviewStyles from './deposit-tx-overview.styles'
import { ReactComponent as CheckIcon } from '../../images/check-icon.svg'
import { ReactComponent as LinkIcon } from '../../images/link-icon.svg'

import { NETWORKS } from '../../constants'

function TxOverview ({ wallet, txData, onGoBack, onDisconnectWallet, tokenInfo, balance }) {
  const classes = useTxOverviewStyles()

  return (
    <div className={classes.txOverview}>
      <Header
        address={wallet.address}
        title="Gnosis Beacon Chain Deposit"
        onGoBack={onGoBack}
        onDisconnectWallet={onDisconnectWallet}
        tokenInfo={tokenInfo}
        balance={balance}
      />
      <CheckIcon className={classes.checkIcon} />
      <p className={classes.title}>Deposits have been made!</p>
      <div className={classes.buttonGroup}>
        <a
          className={classes.button}
          href={`${NETWORKS[wallet.chainId].blockExplorerUrl}/tx/${txData.data.hash}`}
          target='_blank'
          rel='noopener noreferrer'
        >
          Check transaction details here
          <LinkIcon className={classes.buttonIcon} />
        </a>
      </div>
      <div className={classes.note}>
        <b>Note!</b> The validators will be live in 1.5 - 2 hours.{' '}
        <a
          className={classes.noteLink}
          href="https://docs.gnosischain.com/validator-info/validator-deposits"
          target='_blank'
          rel='noopener noreferrer'
        >
          Learn more
        </a>
      </div>
    </div>
  )
}

export default TxOverview

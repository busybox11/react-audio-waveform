import React from 'react'

class AudioWaveform extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      loopback: false,
      record: !props.stop,
      shouldSave: false,
      multiplyingFactor: props.multiplyingFactor,
      barStyles: props.barStyles,
      barContainerStyles: props.barContainerStyles
    }

    this.audioContext = new window.AudioContext()
    this.analyser = null
    this.stream = null
    this.recorder = null
    this.source = null

    this.bufferLength = null
    this.dataArray = null

    this.chunks = []
    this.amplitudes = []
    this.fullAmplitudes = []
    this.currentAmplitudes = []

    // In case the prop changes, we will handle it on the
    // getDerivedStateFromProps lifecycle method
    this.maxBarCount = props.maxBarCount

    this.BAR_DELAY = props.barDelay
    this.AVG_PERIOD = props.averagePeriod

    this.curAmplLoop = () => {
      this.analyser.getByteFrequencyData(this.dataArray)

      for (let i = 0; i < this.bufferLength; i++) {
        this.currentAmplitudes.push(this.dataArray[i])
      }
    }
    this.curAmplInterval = null

    this.avgAmplLoop = () => {
      const sum = this.currentAmplitudes.reduce((a, b) => a + b, 0)
      const average = sum / this.currentAmplitudes.length

      // Push average amplitude to array
      // Also limits the number of bars to maxBarCount
      // by removing the first element if the array is too long
      this.amplitudes.push(average)
      this.fullAmplitudes.push(average)

      if (this.amplitudes.length > this.maxBarCount) {
        this.amplitudes.shift()
      }

      // Resets current amplitudes array for next average
      this.currentAmplitudes = []

      // Force update to re-render the component
      // Better approach than using state for performance reasons
      this.forceUpdate()
    }
    this.avgAmplInterval = null

    // Inject style
    const style = document.createElement('style')
    style.innerHTML = `
    @keyframes reveal_left {
      from { transform: translateX(var(--audio-waveform-translate)) }
      to { transform: translateX(0px) }
    }`
    document.getElementsByTagName('head')[0].appendChild(style)
  }

  // Rewrite the above method with the new static getDerivedStateFromProps
  // lifecycle method
  static getDerivedStateFromProps(nextProps, prevState) {
    const updates = {}

    if (nextProps.maxBarCount !== prevState.maxBarCount) {
      updates.maxBarCount = nextProps.maxBarCount
    }
    if (nextProps.multiplyingFactor !== prevState.multiplyingFactor) {
      updates.multiplyingFactor = nextProps.multiplyingFactor
    }
    if (nextProps.barStyles !== prevState.barStyles) {
      updates.barStyles = nextProps.barStyles
    }
    if (nextProps.barContainerStyles !== prevState.barContainerStyles) {
      updates.barContainerStyles = nextProps.barContainerStyles
    }

    if (nextProps.stop !== prevState.stop) {
      updates.stop = nextProps.stop
    }

    // props.saveRecord is used to save the recording
    // This is done by setting a new shouldSave state
    if (nextProps.saveRecord !== prevState.saveRecord) {
      updates.saveRecord = nextProps.saveRecord
    }

    return updates
  }

  componentDidUpdate(prevProps, prevState) {
    // Handle barDelay and averagePeriod props
    if (
      this.props.barDelay !== prevProps.barDelay ||
      this.props.averagePeriod !== prevProps.averagePeriod
    ) {
      clearInterval(this.curAmplInterval)
      clearInterval(this.avgAmplInterval)

      this.BAR_DELAY = this.props.barDelay
      this.AVG_PERIOD = this.props.averagePeriod

      this.curAmplInterval = setInterval(this.curAmplLoop, this.AVG_PERIOD)
      this.avgAmplInterval = setInterval(this.avgAmplLoop, this.BAR_DELAY)
    }

    // Handle stop prop
    if (this.state.stop !== prevState.stop) {
      if (this.state.stop) {
        this.clearRecLoop()
      } else {
        this.startRecLoop()
      }
    }

    // Handle saveRecord prop
    if (this.state.saveRecord !== prevState.saveRecord) {
      if (this.state.saveRecord) {
        this.clearRecLoop()
      }
    }

    // Handle maxBarCount prop
    if (this.state.maxBarCount !== prevState.maxBarCount) {
      this.maxBarCount = this.state.maxBarCount
      this.amplitudes = this.fullAmplitudes.slice(
        this.fullAmplitudes.length - this.state.maxBarCount
      )
    }
  }

  startRecLoop() {
    this.bufferLength = this.analyser.frequencyBinCount
    this.dataArray = new Uint8Array(this.bufferLength)

    this.avgAmplInterval = setInterval(this.avgAmplLoop, this.BAR_DELAY)
    this.curAmplInterval = setInterval(this.curAmplLoop, this.AVG_PERIOD)
  }

  clearRecLoop() {
    // Stop recording
    this.recorder.stop()
    this.stream.getTracks().forEach((track) => {
      track.stop()
    })

    if (this.props.onReturnAmplitudes) {
      this.props.onReturnAmplitudes(this.amplitudes)
    }

    // Clear intervals
    clearInterval(this.curAmplInterval)
    clearInterval(this.avgAmplInterval)
  }

  componentDidMount() {
    navigator.mediaDevices
      .getUserMedia(this.props.getUserMediaConstraints)
      .then((stream) => {
        // Create a new MediaRecorder instance, and start recording
        this.stream = stream
        const recorder = new window.MediaRecorder(stream)
        this.recorder = recorder
        recorder.start()

        recorder.ondataavailable = (e) => {
          this.chunks.push(e.data)

          this.props.onSaveRecord(this.chunks)
        }

        // Create a new AnalyserNode, and connect it to the MediaStreamAudioSourceNode
        this.analyser = this.audioContext.createAnalyser()
        this.analyser.fftSize = 256

        // Create a MediaStreamAudioSourceNode
        // Feed the HTMLMediaElement into it
        const source = this.audioContext.createMediaStreamSource(stream)
        this.source = source
        source.connect(this.analyser)

        this.startRecLoop()
      })
      .catch((err) => {
        console.log(err)
      })
  }

  render() {
    const { fullAmplitudes, amplitudes, state } = this
    const { multiplyingFactor, barStyles, barContainerStyles } = state

    const barWidth = this.props.barStyles.width || '2px'
    const barMargin = this.props.barStyles.marginRight || '2px'

    const barStyle = (amplitude) => {
      return Object.assign(
        {},
        Object.assign(
          {},
          {
            '--audio-waveform-translate': `${
              parseInt(barWidth) + parseInt(barMargin)
            }px`,
            width: barWidth,
            marginRight: barMargin,
            backgroundColor: 'white',
            animation: `reveal_left ${this.BAR_DELAY}ms linear`
          },
          barStyles
        ),
        {
          height: `${(amplitude / 256) * multiplyingFactor + 2}px`
        }
      )
    }

    const amountBars = fullAmplitudes.length
    const barsArray = amplitudes.map((amplitude, index) => {
      const newBarStyle = barStyle(amplitude)

      // Generate unique key based on position in array and number of iterations
      // This is done to ensure that the animation is restarted when the number of bars changes
      const key = `${amountBars - index}-${amountBars}`

      return <div key={key} style={newBarStyle} />
    })

    const newBarContStyle = Object.assign(
      {},
      {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        position: 'absolute',
        bottom: '0',
        right: '0',
        top: '0'
      },
      barContainerStyles
    )

    return <div style={newBarContStyle}>{barsArray}</div>
  }
}

AudioWaveform.defaultProps = {
  barDelay: 100,
  averagePeriod: 5,
  maxBarCount: 100,
  multiplyingFactor: 100,
  barStyles: {},
  barContainerStyles: {},
  stop: false,
  saveRecord: false,
  getUserMediaConstraints: {
    audio: true
  },
  shouldTransition: true
}

export default AudioWaveform

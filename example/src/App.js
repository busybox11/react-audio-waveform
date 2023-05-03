import React, { useState } from 'react'

import AudioWaveform from 'react-audio-waveform'

const App = () => {
  const [hasClicked, setHasClicked] = useState(false)

  // Props
  const [barDelay, setBarDelay] = useState(100)
  const [averagePeriod, setAveragePeriod] = useState(5)
  const [stop, setStop] = useState(false)
  const [multiplyingFactor, setMultiplyingFactor] = useState(100)
  const [maxBarCount, setMaxBarCount] = useState(100)
  const [saveRecord, setSaveRecord] = useState(false)

  const propStyles = {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center'
  }

  return (
    <>
      {!hasClicked && (
        <div
          className='overlay'
          onClick={() => {
            setHasClicked(true)
          }}
        >
          <h1>Click to continue</h1>
        </div>
      )}
      {hasClicked && (
        <div>
          <AudioWaveform
            barDelay={barDelay}
            averagePeriod={averagePeriod}
            stop={stop}
            multiplyingFactor={multiplyingFactor}
            maxBarCount={maxBarCount}
            saveRecord={saveRecord}
            onSaveRecord={(record) => {
              console.log(record)
            }}
            onReturnAmplitudes={(bars) => {
              console.log(bars)
            }}
          />

          <div id='propsOverlay'>
            <h1>Props</h1>

            <div style={propStyles}>
              <input
                type='number'
                value={barDelay}
                onChange={(e) => {
                  setBarDelay(e.target.value)
                }}
              />
              <h2>barDelay</h2>
            </div>
            <div style={propStyles}>
              <input
                type='number'
                value={averagePeriod}
                onChange={(e) => {
                  setAveragePeriod(e.target.value)
                }}
              />
              <h2>averagePeriod</h2>
            </div>
            <div style={propStyles}>
              <input
                type='checkbox'
                checked={stop}
                onChange={(e) => {
                  setStop(e.target.checked)
                }}
              />
              <h2>stop</h2>
            </div>
            <div style={propStyles}>
              <input
                type='number'
                value={multiplyingFactor}
                onChange={(e) => {
                  setMultiplyingFactor(e.target.value)
                }}
              />
              <h2>multiplyingFactor</h2>
            </div>
            <div style={propStyles}>
              <input
                type='number'
                value={maxBarCount}
                onChange={(e) => {
                  setMaxBarCount(e.target.value)
                }}
              />
              <h2>maxBarCount</h2>
            </div>
            <div style={propStyles}>
              <input
                type='checkbox'
                checked={saveRecord}
                onChange={(e) => {
                  setSaveRecord(e.target.checked)
                }}
              />
              <h2>saveRecord</h2>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default App

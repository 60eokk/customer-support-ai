

// page.js is the React component that serves as a chat interface for the assistant AI (using MUI components)


'use client'

import { Box, Button, Stack, TextField } from '@mui/material'
import { useState, useEffect, useRef } from 'react' // imported from React to manage component state

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm the Headstarter support assistant. How can I help you today?",
    },
  ])
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // sendMessage is a asynchoronous function that
  // 1. validates user input (make sure its not empty)
  // 2. send usser message to server endpoint
  // 3. processess the server's response, which is streamed back in chunks
  // 4. updates chat interface with response or an error message
  const sendMessage = async () => {
    if (!message.trim() || isLoading) return;  // Don't send empty messages (Check if input message is empty) trim() removes any leading whitespace from input
    setIsLoading(true)
  
    setMessage('') // clears input after message is sent
    setMessages((messages) => [
      ...messages, // copies existing message
      { role: 'user', content: message },
      { role: 'assistant', content: '' }, // empty message for assistant, which will b filled with their response
    ])
  
    try {
      const response = await fetch('/api/chat', { // Send user's message to /api/chat/ endpoint using HTTP POST request
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', // sets content type to application/json to indicate JSON date
        },
        body: JSON.stringify([...messages, { role: 'user', content: message }]), // convert message array to JSON string
      })
  
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
  
      const reader = response.body.getReader() // setup to read
      const decoder = new TextDecoder() // setup to decode
  
      while (true) {
        const { done, value } = await reader.read() // reads chunks of data from response stream
        if (done) break
        const text = decoder.decode(value, { stream: true }) // decodes chunk into a string
        setMessages((messages) => {
          let lastMessage = messages[messages.length - 1] // takes last message (assistant)
          let otherMessages = messages.slice(0, messages.length - 1)
          return [
            ...otherMessages,
            { ...lastMessage, content: lastMessage.content + text }, // appends new text to existing content
          ]
        })
      }
    } catch (error) { // only catching errors that occur during fetch, or streaming process
      console.error('Error:', error)
      setMessages((messages) => [
        ...messages,
        { role: 'assistant', content: "I'm sorry, but I encountered an error. Please try again later." },
      ])
    }
    setIsLoading(false)
  }

  const handleKeyPress = (event) => {
    if (event.key == 'Enter' && !event.shiftKey) {
      event.preventDefault()
      sendMessage()
    }
  }

  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])


  // Box is the main container, Stack is the chat container in big
  // Under the Stack chat, there is Stack (message list), and Box (message box), and another Stack (input message)

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
    >
      <Stack
        direction={'column'}
        width="500px"
        height="700px"
        border="1px solid black"
        p={2}
        spacing={3}
      >
        <Stack
          direction={'column'}
          spacing={2}
          flexGrow={1}
          overflow="auto"
          maxHeight="100%"
        >
          {messages.map((message, index) => (
            <Box
              key={index}
              display="flex"
              justifyContent={
                message.role === 'assistant' ? 'flex-start' : 'flex-end'
              }
            >
              <Box
                bgcolor={
                  message.role === 'assistant'
                    ? 'primary.main'
                    : 'secondary.main'
                }
                color="white"
                borderRadius={16}
                p={3}
              >
                {message.content}
              </Box>
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </Stack>
        <Stack direction={'row'} spacing={2}>
          <TextField
            label="Message"
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
          <Button 
            variant="contained" 
            onClick={sendMessage}
            disabled={isLoading}
          >
            {isLoading ? 'Sending...' : 'Send'}
          </Button>
        </Stack>
      </Stack>
    </Box>
  )
}
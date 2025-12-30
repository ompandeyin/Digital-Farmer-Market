import React, { useState } from 'react'
import { Upload, X } from 'lucide-react'

const ImageUpload = ({ onImageSelect, maxSize = 10485760 }) => {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState('')
  const [fileName, setFileName] = useState('')
  const [preview, setPreview] = useState('')

  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const validateFile = (file) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

    if (!allowedTypes.includes(file.type)) {
      setError('Only image files are allowed (JPEG, PNG, WebP, GIF)')
      return false
    }

    if (file.size > maxSize) {
      setError(`File size exceeds ${maxSize / 1024 / 1024}MB limit`)
      return false
    }

    return true
  }

  const handleFile = (file) => {
    if (!validateFile(file)) return

    setError('')
    setFileName(file.name)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target.result)
    }
    reader.readAsDataURL(file)

    // Pass file to parent component
    onImageSelect(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleFileInputChange = (e) => {
    const files = e.target.files
    if (files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleRemove = () => {
    setFileName('')
    setPreview('')
    setError('')
    onImageSelect(null)
  }

  return (
    <div className="w-full">
      <label className="block text-sm font-semibold text-gray-800 mb-2">Product Image</label>

      {/* Error Alert */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Preview Image */}
      {preview && (
        <div className="mb-4 relative">
          <img
            src={preview}
            alt="Product preview"
            className="h-48 w-48 object-cover rounded-lg border border-gray-200"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600"
          >
            ✕
          </button>
          <p className="text-xs text-gray-600 mt-2">{fileName}</p>
        </div>
      )}

      {/* Upload Area */}
      {!preview && (
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition cursor-pointer ${
            isDragging
              ? 'border-green-500 bg-green-50'
              : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
          }`}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
            id="file-input"
          />

          <label htmlFor="file-input" className="cursor-pointer block">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-700 font-medium mb-1">Drag and drop your image here</p>
            <p className="text-gray-500 text-sm mb-4">or click to select a file</p>
            <p className="text-gray-400 text-xs">
              Maximum file size: {maxSize / 1024 / 1024}MB (JPEG, PNG, WebP, GIF)
            </p>
          </label>
        </div>
      )}
    </div>
  )
}

export default ImageUpload

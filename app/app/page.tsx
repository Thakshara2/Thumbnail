// app/app/page.tsx
'use client'

import React, { useRef, useState, useEffect } from 'react';
import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { Button } from '@/components/ui/button';
import { removeBackground } from "@imgly/background-removal";
import { PlusIcon, ReloadIcon } from '@radix-ui/react-icons';
import TextCustomizer from '@/components/editor/text-customizer';
import Image from 'next/image';
import { Accordion } from '@/components/ui/accordion';
import '@/app/fonts.css'
import { ModeToggle } from '@/components/mode-toggle';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from "@/components/ui/separator";
import { Card } from "@/app/components/ui/card";
import { IconPhoto, IconTypography } from '@tabler/icons-react';
import { motion, Reorder, useDragControls } from "framer-motion";

const Page = () => {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isImageSetupDone, setIsImageSetupDone] = useState<boolean>(false);
    const [removedBgImageUrl, setRemovedBgImageUrl] = useState<string | null>(null);
    const [textSets, setTextSets] = useState<Array<any>>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    const handleUploadImage = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const imageUrl = URL.createObjectURL(file);
            setSelectedImage(imageUrl);
            await setupImage(imageUrl);
        }
    };

    const setupImage = async (imageUrl: string) => {
        try {
            const imageBlob = await removeBackground(imageUrl);
            const url = URL.createObjectURL(imageBlob);
            setRemovedBgImageUrl(url);
            setIsImageSetupDone(true);
        } catch (error) {
            console.error(error);
        }
    };

    const addNewTextSet = () => {
        const newId = Math.max(...textSets.map(set => set.id), 0) + 1;
        setTextSets(prev => [...prev, {
            id: newId,
            text: 'edit',
            fontFamily: 'Inter',
            top: 0,
            left: 0,
            color: 'white',
            fontSize: 200,
            fontWeight: 800,
            opacity: 1,
            shadowColor: 'rgba(0, 0, 0, 0.8)',
            shadowSize: 4,
            rotation: 0
        }]);
    };

    const handleAttributeChange = (id: number, attribute: string, value: any) => {
        setTextSets(prev => prev.map(set => 
            set.id === id ? { ...set, [attribute]: value } : set
        ));
    };

    const duplicateTextSet = (textSet: any) => {
        const newId = Math.max(...textSets.map(set => set.id), 0) + 1;
        setTextSets(prev => [...prev, { ...textSet, id: newId }]);
    };

    const removeTextSet = (id: number) => {
        setTextSets(prev => prev.filter(set => set.id !== id));
    };

    const handleDragEnd = (textSetId: number, info: any) => {
        const container = containerRef.current;
        if (!container) return;

        const imageRect = container.querySelector('img')?.getBoundingClientRect();
        if (!imageRect) return;

        // Calculate relative position within the actual image bounds
        const relativeX = info.point.x - imageRect.left;
        const relativeY = info.point.y - imageRect.top;

        // Convert to percentage
        const percentX = (relativeX / imageRect.width) * 100;
        const percentY = (relativeY / imageRect.height) * 100;

        // Add momentum dampening
        const velocity = info.velocity;
        const dampening = 0.1;
        const momentumX = velocity.x * dampening;
        const momentumY = velocity.y * dampening;

        // Calculate final position with momentum and constraints
        const finalX = Math.max(0, Math.min(100, percentX + momentumX));
        const finalY = Math.max(0, Math.min(100, percentY + momentumY));

        setTextSets(prev => prev.map(set => 
            set.id === textSetId 
                ? { ...set, left: finalX - 50, top: 50 - finalY }
                : set
        ));
    };

    useEffect(() => {
        if (selectedImage) {
            const img = new window.Image();
            img.src = selectedImage;
            img.onload = () => {
                setCanvasSize({
                    width: img.width,
                    height: img.height
                });
            };
        }
    }, [selectedImage]);

    const saveCompositeImage = async () => {
        if (!canvasRef.current || !selectedImage) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size to match original image
        canvas.width = canvasSize.width;
        canvas.height = canvasSize.height;

        // Calculate scale factor based on the preview container
        const container = containerRef.current;
        if (!container) return;
        const containerRect = container.getBoundingClientRect();
        const containerAspectRatio = containerRect.width / containerRect.height;
        const imageAspectRatio = canvasSize.width / canvasSize.height;

        // Calculate scaling factors
        let scale: number;
        let offsetX = 0;
        let offsetY = 0;

        if (containerAspectRatio > imageAspectRatio) {
            // Container is wider than image
            scale = canvas.height / containerRect.height;
            offsetX = (containerRect.width - (canvas.width / scale)) / 2;
        } else {
            // Container is taller than image
            scale = canvas.width / containerRect.width;
            offsetY = (containerRect.height - (canvas.height / scale)) / 2;
        }

        // Draw background image
        const bgImg = new window.Image();
        bgImg.src = selectedImage;
        await new Promise(resolve => bgImg.onload = resolve);
        ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

        // Draw text layers
        textSets.forEach(textSet => {
            ctx.save();
            
            // Calculate actual positions based on container scale
            const containerX = containerRect.width * ((textSet.left + 50) / 100);
            const containerY = containerRect.height * ((50 - textSet.top) / 100);
            
            // Convert container coordinates to canvas coordinates
            const x = (containerX - offsetX) * scale;
            const y = (containerY - offsetY) * scale;
            
            // Calculate font size based on container scale
            const scaledFontSize = textSet.fontSize * scale;
            
            // Apply text properties
            ctx.font = `${textSet.fontWeight} ${scaledFontSize}px ${textSet.fontFamily}`;
            ctx.fillStyle = textSet.color;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.globalAlpha = textSet.opacity;
            
            // Apply rotation
            ctx.translate(x, y);
            ctx.rotate(textSet.rotation * Math.PI / 180);
            
            // Draw text
            ctx.fillText(textSet.text, 0, 0);
            ctx.restore();
        });

        // Draw foreground image if exists
        if (removedBgImageUrl) {
            const fgImg = new window.Image();
            fgImg.src = removedBgImageUrl;
            await new Promise(resolve => fgImg.onload = resolve);
            ctx.drawImage(fgImg, 0, 0, canvas.width, canvas.height);
        }

        // Convert to image and download
        const link = document.createElement('a');
        link.download = 'text-behind-image.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    const snapToGrid = (value: number, gridSize: number = 5) => {
        return Math.round(value / gridSize) * gridSize;
    };

    const constrainPosition = (value: number, min: number = 0, max: number = 100) => {
        return Math.max(min, Math.min(max, value));
    };

    const handlePositionChange = (id: number, axis: 'x' | 'y', value: number) => {
        const snappedValue = snapToGrid(value);
        const constrainedValue = constrainPosition(snappedValue);
        
        setTextSets(prev => prev.map(set => 
            set.id === id 
                ? { 
                    ...set, 
                    [axis === 'x' ? 'left' : 'top']: axis === 'x' ? constrainedValue - 50 : 50 - constrainedValue 
                  }
                : set
        ));
    };

    return (
        <div className='flex flex-col h-screen bg-background'>
            <header className='flex flex-row items-center justify-between p-4 border-b'>
                <h2 className="text-xl font-semibold tracking-tight">
                    Text Behind Image Editor
                </h2>
                <div className='flex items-center gap-3'>
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                        accept=".jpg, .jpeg, .png"
                    />
                    <Button 
                        onClick={handleUploadImage}
                        variant="outline"
                        className="flex items-center gap-2"
                    >
                        <IconPhoto size={18} />
                        Upload Image
                    </Button>
                    <ModeToggle />
                </div>
            </header>

            {selectedImage ? (
                <div className='flex h-[calc(100vh-4rem)] overflow-hidden'>
                    <div className="flex-1 p-6 overflow-auto">
                        <div className="flex flex-col gap-4 h-full">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium">Preview</h3>
                                <Button onClick={saveCompositeImage} variant="default">
                                    Save Image
                                </Button>
                            </div>
                            <Card className="flex-1 relative rounded-lg overflow-hidden bg-dot-thick bg-neutral-50 dark:bg-neutral-950">
                                <canvas ref={canvasRef} style={{ display: 'none' }} />
                                <div ref={containerRef} className="relative w-full h-full flex items-center justify-center">
                                    {selectedImage && (
                                        <Image
                                            src={selectedImage}
                                            alt="Background"
                                            layout="fill"
                                            objectFit="contain"
                                            className="pointer-events-none"
                                            priority
                                        />
                                    )}
                                    {textSets.map((textSet) => (
                                        <motion.div
                                            key={textSet.id}
                                            drag
                                            dragMomentum={true}
                                            dragElastic={0.1}
                                            dragConstraints={containerRef}
                                            onDragEnd={(_, info) => handleDragEnd(textSet.id, info)}
                                            dragTransition={{ 
                                                power: 0.2,
                                                timeConstant: 200,
                                                modifyTarget: target => Math.round(target / 5) * 5 // Snap to grid
                                            }}
                                            whileDrag={{ 
                                                scale: 1.02,
                                                transition: { duration: 0.1 }
                                            }}
                                            style={{
                                                position: 'absolute',
                                                top: `${50 - textSet.top}%`,
                                                left: `${textSet.left + 50}%`,
                                                transform: `translate(-50%, -50%) rotate(${textSet.rotation}deg)`,
                                                color: textSet.color,
                                                fontSize: `${textSet.fontSize}px`,
                                                fontWeight: textSet.fontWeight,
                                                fontFamily: textSet.fontFamily,
                                                opacity: textSet.opacity,
                                                cursor: 'move',
                                                zIndex: 10,
                                                userSelect: 'none',
                                                touchAction: 'none',
                                                width: 'auto',
                                                height: 'auto',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                transformOrigin: 'center center',
                                            }}
                                            className="drag-handle cursor-move select-none touch-none"
                                        >
                                            <div 
                                                className="relative p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                                style={{
                                                    minWidth: '50px',
                                                    minHeight: '30px',
                                                }}
                                            >
                                                {textSet.text}
                                            </div>
                                        </motion.div>
                                    ))}
                                    {removedBgImageUrl && (
                                        <Image
                                            src={removedBgImageUrl}
                                            alt="Removed background"
                                            layout="fill"
                                            objectFit="contain"
                                            className="pointer-events-none"
                                            style={{ zIndex: 20 }}
                                        />
                                    )}
                                </div>
                            </Card>
                        </div>
                    </div>

                    <div className="w-[400px] border-l bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                        <div className="flex flex-col h-full">
                            <div className="p-4 border-b">
                                <Button 
                                    onClick={addNewTextSet} 
                                    className="w-full"
                                    variant="default"
                                >
                                    <IconTypography className="mr-2 h-4 w-4" />
                                    Add New Text Layer
                                </Button>
                            </div>
                            
                            <ScrollArea className="flex-1 p-4">
                                <Accordion type="single" collapsible className="w-full space-y-4">
                                    {textSets.map((textSet, index) => (
                                        <TextCustomizer
                                            key={textSet.id}
                                            textSet={textSet}
                                            handleAttributeChange={handleAttributeChange}
                                            removeTextSet={removeTextSet}
                                            duplicateTextSet={duplicateTextSet}
                                        />
                                    ))}
                                </Accordion>
                            </ScrollArea>
                        </div>
                    </div>
                </div>
            ) : (
                <div className='flex flex-col items-center justify-center flex-1 p-6 text-center'>
                    <IconPhoto size={48} className="text-muted-foreground mb-4" />
                    <h2 className="text-xl font-semibold mb-2">No Image Selected</h2>
                    <p className="text-muted-foreground mb-4">
                        Upload an image to get started with your design
                    </p>
                    <Button onClick={handleUploadImage} size="lg">
                        Choose Image
                    </Button>
                </div>
            )}
        </div>
    );
}

export default Page;
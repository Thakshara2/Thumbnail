import React from 'react';
import InputField from './input-field';
import SliderField from './slider-field';
import ColorPicker from './color-picker';
import FontFamilyPicker from './font-picker'; 
import { Button } from '../ui/button';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { IconCopy, IconTrash, IconGripVertical } from '@tabler/icons-react';
import { Label } from "@/components/ui/label"

interface TextCustomizerProps {
    textSet: {
        id: number;
        text: string;
        fontFamily: string;
        top: number;
        left: number;
        color: string;
        fontSize: number;
        fontWeight: number;
        opacity: number;
        rotation: number;
        shadowColor: string;
        shadowSize: number;
    };
    handleAttributeChange: (id: number, attribute: string, value: any) => void;
    removeTextSet: (id: number) => void;
    duplicateTextSet: (textSet: any) => void;
}

const TextCustomizer: React.FC<TextCustomizerProps> = ({
    textSet,
    handleAttributeChange,
    removeTextSet,
    duplicateTextSet,
}) => {
    return (
        <AccordionItem value={`item-${textSet.id}`} className="border rounded-lg overflow-hidden">
            <AccordionTrigger className="px-4 py-2 hover:no-underline">
                <div className="flex items-center gap-2 w-full">
                    <IconGripVertical className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 text-sm font-medium">
                        Text Layer {textSet.id}
                    </span>
                </div>
            </AccordionTrigger>
            <AccordionContent className="border-t">
                <div className="p-4 space-y-4">
                    <div className="flex gap-2 mb-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => duplicateTextSet(textSet)}
                            className="flex-1"
                        >
                            <IconCopy className="h-4 w-4 mr-2" />
                            Duplicate
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeTextSet(textSet.id)}
                            className="flex-1 text-destructive"
                        >
                            <IconTrash className="h-4 w-4 mr-2" />
                            Remove
                        </Button>
                    </div>

                    <div className="space-y-4">
                        <InputField
                            attribute="text"
                            label="Text Content"
                            currentValue={textSet.text}
                            handleAttributeChange={(attribute, value) => 
                                handleAttributeChange(textSet.id, attribute, value)
                            }
                        />

                        <FontFamilyPicker
                            attribute="fontFamily"
                            currentFont={textSet.fontFamily}
                            handleAttributeChange={(attribute, value) => 
                                handleAttributeChange(textSet.id, attribute, value)
                            }
                        />

                        <div className="space-y-2">
                            <Label>Text Color</Label>
                            <ColorPicker
                                attribute="color"
                                label="Text Color"
                                currentColor={textSet.color}
                                handleAttributeChange={(attribute, value) => 
                                    handleAttributeChange(textSet.id, attribute, value)
                                }
                            />
                        </div>

                        <SliderField
                            attribute="fontSize"
                            label="Font Size"
                            currentValue={textSet.fontSize}
                            min={10}
                            max={400}
                            handleAttributeChange={(attribute, value) => 
                                handleAttributeChange(textSet.id, attribute, value)
                            }
                        />

                        <div className="space-y-2">
                            <Label>Position</Label>
                            <div className="grid grid-cols-2 gap-4">
                                <SliderField
                                    attribute="left"
                                    label="X Position"
                                    currentValue={textSet.left + 50}
                                    min={0}
                                    max={100}
                                    step={0.1}
                                    handleAttributeChange={(attribute, value) => 
                                        handleAttributeChange(textSet.id, attribute, value - 50)
                                    }
                                />
                                <SliderField
                                    attribute="top"
                                    label="Y Position"
                                    currentValue={50 - textSet.top}
                                    min={0}
                                    max={100}
                                    step={0.1}
                                    handleAttributeChange={(attribute, value) => 
                                        handleAttributeChange(textSet.id, attribute, 50 - value)
                                    }
                                />
                            </div>
                        </div>

                        <SliderField
                            attribute="rotation"
                            label="Rotation"
                            currentValue={textSet.rotation}
                            min={-180}
                            max={180}
                            step={1}
                            handleAttributeChange={(attribute, value) => 
                                handleAttributeChange(textSet.id, attribute, value)
                            }
                        />
                    </div>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
};

export default TextCustomizer;
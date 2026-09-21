import { FieldRendererRegistry } from './field-renderer.registry'
import { HiddenFieldRenderer } from './hidden.renderer'
import { TextFieldRenderer } from './text.renderer'
import { TextareaFieldRenderer } from './textarea.renderer'
import { SelectFieldRenderer } from './select.renderer'
import { FileFieldRenderer } from './file.renderer'
import { SearchFieldRenderer } from './search.renderer'
import { IconFieldRenderer } from './icon.renderer'
import { CheckboxGroupFieldRenderer } from './checkbox-group.renderer'
import { CalendarFieldRenderer } from './calendar.renderer'
import { DateFieldRenderer } from './date.renderer'

FieldRendererRegistry.register('hidden', new HiddenFieldRenderer())
FieldRendererRegistry.register(['text', 'email', 'password', 'number'], new TextFieldRenderer())
FieldRendererRegistry.register('textarea', new TextareaFieldRenderer())
FieldRendererRegistry.register('select', new SelectFieldRenderer())
FieldRendererRegistry.register('file', new FileFieldRenderer())
FieldRendererRegistry.register('search', new SearchFieldRenderer())
FieldRendererRegistry.register('icon', new IconFieldRenderer())
FieldRendererRegistry.register('checkbox-group', new CheckboxGroupFieldRenderer())
FieldRendererRegistry.register('calendar', new CalendarFieldRenderer())
FieldRendererRegistry.register(['date', 'time', 'datetime-local'], new DateFieldRenderer())

export { FieldRendererRegistry } from './field-renderer.registry'
export type { FieldRenderer, FieldRenderContext } from './field-renderer.types'

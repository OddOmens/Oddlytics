import { Card, Metric, Text } from '@tremor/react';

interface StatsCardProps {
    title: string;
    value: string | number;
    description?: string;
}

export function StatsCard({ title, value, description }: StatsCardProps) {
    return (
        <Card>
            <Text>{title}</Text>
            <Metric>{value.toLocaleString()}</Metric>
            {description && <Text className="mt-2">{description}</Text>}
        </Card>
    );
}
